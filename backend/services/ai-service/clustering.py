"""
0711 Face Clustering Service
DBSCAN-based face clustering for automatic person grouping
"""

import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import normalize
from typing import List, Tuple, Optional
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://vault:vault@localhost:5432/vault")


class FaceClusterer:
    """
    Clusters face embeddings using DBSCAN algorithm.
    
    DBSCAN is ideal for face clustering because:
    - It doesn't require knowing the number of clusters in advance
    - It can identify noise/outliers (unknown faces)
    - It handles clusters of varying sizes well
    """
    
    def __init__(
        self,
        eps: float = 0.5,
        min_samples: int = 2,
        metric: str = 'cosine'
    ):
        """
        Initialize the clusterer.
        
        Args:
            eps: Maximum distance between two samples to be in same cluster.
                 For cosine distance, 0.5 is a good starting point.
            min_samples: Minimum samples in a neighborhood to form a cluster.
                        2 means even pairs of similar faces form a cluster.
            metric: Distance metric. 'cosine' works best for face embeddings.
        """
        self.eps = eps
        self.min_samples = min_samples
        self.metric = metric
        self.clusterer = DBSCAN(
            eps=eps,
            min_samples=min_samples,
            metric=metric
        )
    
    def cluster(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Cluster face embeddings.
        
        Args:
            embeddings: Array of shape (n_faces, embedding_dim)
        
        Returns:
            Array of cluster labels. -1 indicates noise/outlier.
        """
        if len(embeddings) == 0:
            return np.array([])
        
        # Normalize embeddings for cosine similarity
        if self.metric == 'cosine':
            embeddings = normalize(embeddings)
        
        labels = self.clusterer.fit_predict(embeddings)
        return labels
    
    def get_cluster_centroids(
        self, 
        embeddings: np.ndarray, 
        labels: np.ndarray
    ) -> dict:
        """
        Compute centroid embedding for each cluster.
        
        Args:
            embeddings: Array of shape (n_faces, embedding_dim)
            labels: Cluster labels from cluster()
        
        Returns:
            Dict mapping cluster_id to centroid embedding
        """
        centroids = {}
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:  # Skip noise
                continue
            
            mask = labels == label
            cluster_embeddings = embeddings[mask]
            centroid = np.mean(cluster_embeddings, axis=0)
            # Normalize centroid
            centroid = centroid / np.linalg.norm(centroid)
            centroids[int(label)] = centroid.tolist()
        
        return centroids
    
    def find_nearest_cluster(
        self,
        embedding: np.ndarray,
        centroids: dict,
        threshold: float = 0.6
    ) -> Optional[int]:
        """
        Find the nearest existing cluster for a new face embedding.
        
        Args:
            embedding: Face embedding to match
            centroids: Dict of cluster centroids
            threshold: Minimum similarity to assign to cluster
        
        Returns:
            Cluster ID or None if no match above threshold
        """
        if not centroids:
            return None
        
        embedding = embedding / np.linalg.norm(embedding)
        
        best_cluster = None
        best_similarity = threshold
        
        for cluster_id, centroid in centroids.items():
            centroid = np.array(centroid)
            similarity = np.dot(embedding, centroid)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_cluster = cluster_id
        
        return best_cluster


async def run_clustering_for_user(user_id: str, db_pool: asyncpg.Pool) -> dict:
    """
    Run face clustering for all unclustered faces of a user.
    
    Args:
        user_id: User ID to cluster faces for
        db_pool: Database connection pool
    
    Returns:
        Dict with clustering statistics
    """
    async with db_pool.acquire() as conn:
        # Get all faces with embeddings that don't have a cluster
        faces = await conn.fetch("""
            SELECT id, embedding
            FROM faces
            WHERE user_id = $1 
              AND embedding IS NOT NULL
              AND cluster_id IS NULL
        """, user_id)
        
        if not faces:
            return {"status": "no_faces", "clustered": 0, "clusters_created": 0}
        
        # Get existing clusters and their centroids
        existing_clusters = await conn.fetch("""
            SELECT id, centroid
            FROM face_clusters
            WHERE user_id = $1 AND centroid IS NOT NULL
        """, user_id)
        
        existing_centroids = {
            str(c["id"]): list(c["centroid"]) 
            for c in existing_clusters 
            if c["centroid"]
        }
        
        # Prepare embeddings
        face_ids = [str(f["id"]) for f in faces]
        embeddings = np.array([list(f["embedding"]) for f in faces])
        
        # Initialize clusterer
        clusterer = FaceClusterer(eps=0.5, min_samples=2)
        
        # First, try to assign to existing clusters
        assignments = {}
        unassigned_indices = []
        
        for i, (face_id, embedding) in enumerate(zip(face_ids, embeddings)):
            nearest = clusterer.find_nearest_cluster(embedding, existing_centroids, threshold=0.6)
            if nearest is not None:
                assignments[face_id] = nearest
            else:
                unassigned_indices.append(i)
        
        # Cluster remaining unassigned faces
        new_clusters_created = 0
        if unassigned_indices:
            unassigned_embeddings = embeddings[unassigned_indices]
            unassigned_face_ids = [face_ids[i] for i in unassigned_indices]
            
            labels = clusterer.cluster(unassigned_embeddings)
            centroids = clusterer.get_cluster_centroids(unassigned_embeddings, labels)
            
            # Create new clusters in database
            cluster_id_map = {}  # Maps DBSCAN label to database cluster ID
            
            for label, centroid in centroids.items():
                centroid_str = "[" + ",".join(map(str, centroid)) + "]"
                cluster_id = await conn.fetchval("""
                    INSERT INTO face_clusters (user_id, centroid, photo_count)
                    VALUES ($1, $2::vector, 0)
                    RETURNING id
                """, user_id, centroid_str)
                cluster_id_map[label] = str(cluster_id)
                new_clusters_created += 1
            
            # Assign faces to new clusters
            for i, (face_id, label) in enumerate(zip(unassigned_face_ids, labels)):
                if label != -1:  # Not noise
                    assignments[face_id] = cluster_id_map[label]
        
        # Update faces with cluster assignments
        for face_id, cluster_id in assignments.items():
            await conn.execute("""
                UPDATE faces SET cluster_id = $1 WHERE id = $2
            """, cluster_id if isinstance(cluster_id, str) else str(cluster_id), 
                face_id if isinstance(face_id, str) else str(face_id))
        
        # Update cluster photo counts
        await conn.execute("""
            UPDATE face_clusters fc
            SET photo_count = (
                SELECT COUNT(DISTINCT f.item_id)
                FROM faces f
                WHERE f.cluster_id = fc.id
            )
            WHERE fc.user_id = $1
        """, user_id)
        
        # Update cluster centroids for clusters that got new faces
        updated_cluster_ids = set(str(v) for v in assignments.values())
        for cluster_id in updated_cluster_ids:
            # Recalculate centroid
            cluster_faces = await conn.fetch("""
                SELECT embedding FROM faces
                WHERE cluster_id = $1 AND embedding IS NOT NULL
            """, cluster_id)
            
            if cluster_faces:
                cluster_embeddings = np.array([list(f["embedding"]) for f in cluster_faces])
                new_centroid = np.mean(cluster_embeddings, axis=0)
                new_centroid = new_centroid / np.linalg.norm(new_centroid)
                centroid_str = "[" + ",".join(map(str, new_centroid)) + "]"
                
                await conn.execute("""
                    UPDATE face_clusters SET centroid = $1::vector WHERE id = $2
                """, centroid_str, cluster_id)
        
        return {
            "status": "success",
            "total_faces": len(faces),
            "clustered": len(assignments),
            "clusters_created": new_clusters_created,
            "noise_faces": len(faces) - len(assignments)
        }


async def merge_clusters(
    cluster_ids: List[str],
    user_id: str,
    db_pool: asyncpg.Pool,
    new_name: str = None
) -> str:
    """
    Merge multiple face clusters into one.
    
    Args:
        cluster_ids: List of cluster IDs to merge
        user_id: User ID for validation
        db_pool: Database connection pool
        new_name: Optional name for merged cluster
    
    Returns:
        ID of the merged cluster (keeps the first one)
    """
    if len(cluster_ids) < 2:
        raise ValueError("Need at least 2 clusters to merge")
    
    async with db_pool.acquire() as conn:
        # Keep the first cluster
        primary_cluster = cluster_ids[0]
        clusters_to_merge = cluster_ids[1:]
        
        # Move all faces to primary cluster
        for cluster_id in clusters_to_merge:
            await conn.execute("""
                UPDATE faces 
                SET cluster_id = $1 
                WHERE cluster_id = $2 AND user_id = $3
            """, primary_cluster, cluster_id, user_id)
        
        # Delete merged clusters
        for cluster_id in clusters_to_merge:
            await conn.execute("""
                DELETE FROM face_clusters WHERE id = $1 AND user_id = $2
            """, cluster_id, user_id)
        
        # Update name if provided
        if new_name:
            await conn.execute("""
                UPDATE face_clusters SET encrypted_name = $1 WHERE id = $2
            """, new_name, primary_cluster)
        
        # Recalculate centroid and count
        cluster_faces = await conn.fetch("""
            SELECT embedding FROM faces
            WHERE cluster_id = $1 AND embedding IS NOT NULL
        """, primary_cluster)
        
        if cluster_faces:
            embeddings = np.array([list(f["embedding"]) for f in cluster_faces])
            centroid = np.mean(embeddings, axis=0)
            centroid = centroid / np.linalg.norm(centroid)
            centroid_str = "[" + ",".join(map(str, centroid)) + "]"
            
            await conn.execute("""
                UPDATE face_clusters 
                SET centroid = $1::vector,
                    photo_count = (SELECT COUNT(DISTINCT item_id) FROM faces WHERE cluster_id = $2)
                WHERE id = $2
            """, centroid_str, primary_cluster)
        
        return primary_cluster


async def split_cluster(
    cluster_id: str,
    face_ids_to_split: List[str],
    user_id: str,
    db_pool: asyncpg.Pool,
    new_cluster_name: str = None
) -> str:
    """
    Split faces from a cluster into a new cluster.
    
    Args:
        cluster_id: Source cluster ID
        face_ids_to_split: Face IDs to move to new cluster
        user_id: User ID for validation
        db_pool: Database connection pool
        new_cluster_name: Optional name for new cluster
    
    Returns:
        ID of the new cluster
    """
    async with db_pool.acquire() as conn:
        # Get embeddings for faces to split
        faces = await conn.fetch("""
            SELECT embedding FROM faces
            WHERE id = ANY($1) AND user_id = $2 AND embedding IS NOT NULL
        """, face_ids_to_split, user_id)
        
        # Calculate centroid for new cluster
        if faces:
            embeddings = np.array([list(f["embedding"]) for f in faces])
            centroid = np.mean(embeddings, axis=0)
            centroid = centroid / np.linalg.norm(centroid)
            centroid_str = "[" + ",".join(map(str, centroid)) + "]"
        else:
            centroid_str = None
        
        # Create new cluster
        new_cluster_id = await conn.fetchval("""
            INSERT INTO face_clusters (user_id, encrypted_name, centroid)
            VALUES ($1, $2, $3::vector)
            RETURNING id
        """, user_id, new_cluster_name, centroid_str)
        
        # Move faces to new cluster
        await conn.execute("""
            UPDATE faces SET cluster_id = $1
            WHERE id = ANY($2) AND user_id = $3
        """, str(new_cluster_id), face_ids_to_split, user_id)
        
        # Update counts for both clusters
        for cid in [cluster_id, str(new_cluster_id)]:
            await conn.execute("""
                UPDATE face_clusters
                SET photo_count = (SELECT COUNT(DISTINCT item_id) FROM faces WHERE cluster_id = $1)
                WHERE id = $1
            """, cid)
        
        return str(new_cluster_id)
