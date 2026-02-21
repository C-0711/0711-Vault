// V-06: Quota Usage Dashboard Widget for 0711-Vault
// Path: frontend/src/components/dashboard/QuotaWidget.tsx

"use client"

import { useState, useEffect } from 'react'

interface QuotaData {
  tenant_id: string
  used_bytes: number
  limit_bytes: number
  file_count: number
  file_limit: number
  percentage_used: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function QuotaWidget({ tenantId = 'default' }: { tenantId?: string }) {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch(`/api/quotas/usage/${tenantId}`)
        const data = await res.json()
        setQuota(data)
      } catch (e) {
        console.error('Failed to fetch quota:', e)
      }
      setLoading(false)
    }
    fetchQuota()
  }, [tenantId])

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-full"></div>
      </div>
    )
  }

  if (!quota) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-gray-400">
        Unable to load quota information
      </div>
    )
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4">Storage Usage</h3>
      
      {/* Storage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Used</span>
          <span className="text-white font-medium">
            {formatBytes(quota.used_bytes)} / {formatBytes(quota.limit_bytes)}
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStatusColor(quota.percentage_used)} transition-all duration-500`}
            style={{ width: `${Math.min(quota.percentage_used, 100)}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {quota.percentage_used.toFixed(1)}% used
        </div>
      </div>
      
      {/* File Count */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        <div>
          <div className="text-2xl font-bold text-white">{quota.file_count.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Files</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{formatBytes(quota.limit_bytes - quota.used_bytes)}</div>
          <div className="text-sm text-gray-400">Remaining</div>
        </div>
      </div>
      
      {/* Warning */}
      {quota.percentage_used >= 90 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            ⚠️ Storage almost full. Consider upgrading your plan.
          </p>
        </div>
      )}
    </div>
  )
}

export default QuotaWidget
