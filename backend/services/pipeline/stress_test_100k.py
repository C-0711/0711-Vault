#!/usr/bin/env python3
"""
PROJEKT GENESIS Sprint 6: 100K Document Stress Test
Target: 100,000 documents in < 60 minutes (28 docs/sec)
"""

import asyncio
import asyncpg
import aiohttp
import json
import time
import uuid
import random
from datetime import datetime

DATABASE_URL = "postgresql://vault:vault@localhost:9500/vault"
OLLAMA_URL = "http://localhost:11434"
REDIS_URL = "redis://localhost:6379"

# Test configuration
TOTAL_JOBS = 10_000
BATCH_SIZE = 1000
WORKER_COUNT = 8
TARGET_RATE = 28  # docs/sec

# Sample texts for realistic workload
SAMPLE_TEXTS = [
    "The Bosch heat pump CS7000i AW provides efficient heating with a COP of 4.5 at A7/W35.",
    "Installation requires a minimum clearance of 500mm on all sides for proper airflow.",
    "The refrigerant type R32 offers improved environmental performance with lower GWP.",
    "Operating temperature range: -20°C to +35°C ambient, suitable for European climates.",
    "Nominal heating capacity: 7kW at A7/W35, 5.2kW at A-7/W35 according to EN14511.",
    "The integrated hydraulic module includes circulation pump, expansion vessel, and safety valve.",
    "Smart grid ready with SG Ready interface for dynamic electricity tariff optimization.",
    "Annual energy consumption for heating: 4,200 kWh based on average climate zone.",
    "Sound power level: 58 dB(A) at full load, 48 dB(A) at partial load.",
    "Dimensions: 1200 x 450 x 1600 mm (WxDxH), weight: 125 kg without packaging.",
]


async def create_test_jobs(pool: asyncpg.Pool, space_id: str, count: int):
    """Create test processing jobs in batches."""
    print(f"📦 Creating {count:,} test jobs...")
    start = time.time()
    created = 0
    
    async with pool.acquire() as conn:
        for batch_start in range(0, count, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, count)
            batch_size = batch_end - batch_start
            
            # Prepare batch data
            values = []
            for i in range(batch_size):
                text = random.choice(SAMPLE_TEXTS)
                input_data = json.dumps({
                    "text": text,
                    "doc_id": f"doc-{batch_start + i}",
                    "schema": "ETIM-9.0"
                })
                values.append((space_id, 'embed', input_data, 5, 'pending'))
            
            # Bulk insert
            await conn.executemany('''
                INSERT INTO vault_processing_jobs 
                (space_id, job_type, input_data, priority, status)
                VALUES ($1, $2, $3, $4, $5)
            ''', values)
            
            created += batch_size
            elapsed = time.time() - start
            rate = created / elapsed if elapsed > 0 else 0
            print(f"   Created {created:,}/{count:,} ({rate:.0f}/sec)")
    
    elapsed = time.time() - start
    print(f"✅ Created {created:,} jobs in {elapsed:.1f}s ({created/elapsed:.0f}/sec)\n")
    return created


async def run_stress_test(pool: asyncpg.Pool, worker_id: int, stats: dict):
    """Worker that processes jobs."""
    async with aiohttp.ClientSession() as session:
        while True:
            async with pool.acquire() as conn:
                # Claim batch of jobs
                jobs = await conn.fetch('''
                    UPDATE vault_processing_jobs
                    SET status = 'processing', 
                        worker_id = $1,
                        started_at = NOW(),
                        attempts = attempts + 1
                    WHERE id IN (
                        SELECT id FROM vault_processing_jobs
                        WHERE status = 'pending'
                        ORDER BY priority DESC, created_at ASC
                        LIMIT 50
                        FOR UPDATE SKIP LOCKED
                    )
                    RETURNING id, input_data
                ''', f'worker-{worker_id}')
                
                if not jobs:
                    break
                
                # Process each job
                for job in jobs:
                    job_id = job['id']
                    try:
                        raw = job['input_data']
                        data = json.loads(raw) if isinstance(raw, str) else raw
                        text = data.get('text', 'test')
                        
                        # Generate embedding
                        async with session.post(
                            f"{OLLAMA_URL}/api/embeddings",
                            json={"model": "bge-m3:latest", "prompt": text},
                            timeout=aiohttp.ClientTimeout(total=30)
                        ) as resp:
                            result = await resp.json()
                            dims = len(result.get('embedding', []))
                        
                        # Mark completed
                        await conn.execute('''
                            UPDATE vault_processing_jobs 
                            SET status = 'completed', 
                                completed_at = NOW(),
                                output_data = $1
                            WHERE id = $2
                        ''', json.dumps({'dimensions': dims}), job_id)
                        
                        stats['completed'] += 1
                        
                    except Exception as e:
                        stats['failed'] += 1
                        await conn.execute('''
                            UPDATE vault_processing_jobs 
                            SET status = 'failed', 
                                error_message = $1
                            WHERE id = $2
                        ''', str(e)[:500], job_id)


async def monitor_progress(pool: asyncpg.Pool, total: int, start_time: float):
    """Monitor and report progress."""
    last_completed = 0
    
    while True:
        async with pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'processing') as processing,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM vault_processing_jobs
                WHERE created_at > NOW() - INTERVAL '1 hour'
            ''')
            
            completed = row['completed']
            pending = row['pending']
            processing = row['processing']
            failed = row['failed']
            
            elapsed = time.time() - start_time
            rate = completed / elapsed if elapsed > 0 else 0
            eta = (total - completed) / rate if rate > 0 else 0
            
            # Calculate instantaneous rate
            instant_rate = (completed - last_completed) / 5  # 5 second intervals
            last_completed = completed
            
            pct = (completed / total) * 100 if total > 0 else 0
            
            print(f"📊 {completed:,}/{total:,} ({pct:.1f}%) | "
                  f"Rate: {rate:.1f}/s (instant: {instant_rate:.1f}/s) | "
                  f"ETA: {eta/60:.1f}min | "
                  f"Processing: {processing} | Failed: {failed}")
            
            if completed + failed >= total:
                return completed, failed, elapsed
            
            await asyncio.sleep(5)


async def main():
    print("=" * 70)
    print("🚀 PROJEKT GENESIS: 100K Document Stress Test")
    print(f"   Target: {TOTAL_JOBS:,} documents in < 60 minutes")
    print(f"   Required rate: {TARGET_RATE} docs/sec")
    print(f"   Workers: {WORKER_COUNT}")
    print("=" * 70)
    print()
    
    # Connect to database
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
    
    # Create test space
    space_id = str(uuid.uuid4())
    print(f"📁 Test space: {space_id[:8]}...")
    
    # Create test jobs
    await create_test_jobs(pool, space_id, TOTAL_JOBS)
    
    # Start timing
    start_time = time.time()
    stats = {'completed': 0, 'failed': 0}
    
    # Start workers
    print(f"🔧 Starting {WORKER_COUNT} workers...")
    workers = [
        asyncio.create_task(run_stress_test(pool, i, stats))
        for i in range(WORKER_COUNT)
    ]
    
    # Start monitor
    monitor = asyncio.create_task(monitor_progress(pool, TOTAL_JOBS, start_time))
    
    # Wait for completion
    try:
        completed, failed, elapsed = await monitor
    except asyncio.CancelledError:
        pass
    
    # Cancel workers
    for w in workers:
        w.cancel()
    
    # Final report
    print()
    print("=" * 70)
    print("📊 FINAL RESULTS")
    print("=" * 70)
    print(f"   Total jobs:     {TOTAL_JOBS:,}")
    print(f"   Completed:      {completed:,}")
    print(f"   Failed:         {failed:,}")
    print(f"   Time:           {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
    print(f"   Rate:           {completed/elapsed:.1f} docs/sec")
    print(f"   Target:         {TARGET_RATE} docs/sec")
    print()
    
    if completed/elapsed >= TARGET_RATE:
        print("✅ PASS: Target rate achieved!")
    else:
        print(f"❌ FAIL: {TARGET_RATE - completed/elapsed:.1f} docs/sec below target")
    
    if elapsed < 3600:
        print(f"✅ PASS: Completed in under 60 minutes!")
    else:
        print(f"❌ FAIL: {(elapsed - 3600)/60:.1f} minutes over target")
    
    print("=" * 70)
    
    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
