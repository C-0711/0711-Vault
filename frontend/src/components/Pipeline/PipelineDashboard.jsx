/**
 * PROJEKT GENESIS Sprint 3: Pipeline Dashboard
 * Real-time monitoring of H200V processing pipeline
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider
} from "@mui/material";
import {
  Memory as GpuIcon,
  Speed as SpeedIcon,
  Storage as QueueIcon,
  CheckCircle as DoneIcon,
  Error as ErrorIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon
} from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9506";

function GPUCard({ gpu }) {
  const utilizationColor = gpu.utilization > 80 ? "error" : gpu.utilization > 50 ? "warning" : "success";
  
  return (
    <Card sx={{ minWidth: 200 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <GpuIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">GPU {gpu.index}</Typography>
          <Chip
            size="small"
            label={gpu.available ? "Available" : "Busy"}
            color={gpu.available ? "success" : "warning"}
            sx={{ ml: "auto" }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {gpu.name}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="body2">Utilization: {gpu.utilization}%</Typography>
          <LinearProgress
            variant="determinate"
            value={gpu.utilization}
            color={utilizationColor}
            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
          />
        </Box>
        
        <Box mt={2}>
          <Typography variant="body2">
            Memory: {Math.round(gpu.memory_free_mb / 1024)}GB free
          </Typography>
          <LinearProgress
            variant="determinate"
            value={100 - (gpu.memory_free_mb / 141000) * 100}
            color="primary"
            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
          />
        </Box>
        
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            🌡️ {gpu.temperature}°C
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function QueueStatsCard({ stats }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <QueueIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">Queue Status</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "warning.light" }}>
              <Typography variant="h4">{stats.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "info.light" }}>
              <Typography variant="h4">{stats.processing}</Typography>
              <Typography variant="body2">Processing</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "success.light" }}>
              <Typography variant="h4">{stats.total_completed}</Typography>
              <Typography variant="body2">Completed</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "error.light" }}>
              <Typography variant="h4">{stats.total_failed}</Typography>
              <Typography variant="body2">Failed</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2">
            Avg. Time: {stats.avg_processing_time?.toFixed(2)}s
          </Typography>
          <Typography variant="body2">Retries: {stats.total_retries}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function SpaceProgressCard({ spaceId, progress, onCancel }) {
  const percent = progress.total > 0 
    ? ((progress.completed + progress.failed) / progress.total) * 100 
    : 0;
  
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <TrendingIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Space: {spaceId.slice(0, 8)}...
          </Typography>
          {progress.pending + progress.processing > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => onCancel(spaceId)}
            >
              Cancel
            </Button>
          )}
        </Box>
        
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              {progress.completed + progress.failed} / {progress.total}
            </Typography>
            <Typography variant="body2">{percent.toFixed(1)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{ height: 12, borderRadius: 1 }}
          />
        </Box>
        
        <Grid container spacing={1}>
          <Grid item xs={3}>
            <Chip size="small" icon={<SpeedIcon />} label={`${progress.rate_per_second?.toFixed(1)}/s`} color="primary" variant="outlined" />
          </Grid>
          <Grid item xs={3}>
            <Chip size="small" label={`ETA: ${formatTime(progress.eta_seconds || 0)}`} color="secondary" variant="outlined" />
          </Grid>
          <Grid item xs={3}>
            <Chip size="small" icon={<DoneIcon />} label={progress.completed} color="success" variant="outlined" />
          </Grid>
          <Grid item xs={3}>
            <Chip size="small" icon={<ErrorIcon />} label={progress.failed} color="error" variant="outlined" />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function PipelineDashboard() {
  const [gpuStatus, setGpuStatus] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [spaceProgress, setSpaceProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const fetchData = useCallback(async () => {
    try {
      const [gpuRes, queueRes] = await Promise.all([
        fetch(`${API_BASE}/pipeline/gpu/status`),
        fetch(`${API_BASE}/pipeline/queue/stats`)
      ]);
      
      if (gpuRes.ok) setGpuStatus(await gpuRes.json());
      if (queueRes.ok) setQueueStats(await queueRes.json());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch pipeline status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);
  
  const handleCancelSpace = async (spaceId) => {
    try {
      await fetch(`${API_BASE}/pipeline/batch/${spaceId}/cancel`, { method: "POST" });
      fetchData();
    } catch (err) {
      setError(`Failed to cancel: ${err.message}`);
    }
  };
  
  if (loading && !gpuStatus) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading pipeline status...</Typography>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          🚀 H200V Pipeline Dashboard
        </Typography>
        <Tooltip title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
          <IconButton onClick={() => setAutoRefresh(!autoRefresh)} color={autoRefresh ? "primary" : "default"}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>GPU Cluster (282GB VRAM)</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {gpuStatus?.gpus?.map((gpu) => (
          <Grid item xs={12} md={6} key={gpu.index}>
            <GPUCard gpu={gpu} />
          </Grid>
        ))}
      </Grid>
      
      {gpuStatus && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <strong>Total Capacity:</strong> {Math.round(gpuStatus.free_memory_mb / 1024)}GB free of {Math.round(gpuStatus.total_memory_mb / 1024)}GB | Avg Utilization: {gpuStatus.avg_gpu_utilization?.toFixed(1)}%
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {queueStats && <QueueStatsCard stats={queueStats} />}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Processing</Typography>
              {Object.keys(spaceProgress).length === 0 ? (
                <Typography color="text.secondary">No active processing jobs</Typography>
              ) : (
                Object.entries(spaceProgress).map(([spaceId, progress]) => (
                  <SpaceProgressCard key={spaceId} spaceId={spaceId} progress={progress} onCancel={handleCancelSpace} />
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 4, bgcolor: "background.default" }}>
        <Typography variant="h6" gutterBottom>📊 Performance Target</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">Target</Typography>
            <Typography variant="h6">100K docs/hour</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">Required Rate</Typography>
            <Typography variant="h6">~28 docs/sec</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">Current Rate</Typography>
            <Typography variant="h6" color="primary">
              {queueStats?.total_completed > 0 && queueStats?.avg_processing_time > 0
                ? `${(1 / queueStats.avg_processing_time).toFixed(1)}/s`
                : "--"}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip label={gpuStatus?.gpu_count === 2 ? "2x H200 Ready" : "Checking..."} color="success" />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
