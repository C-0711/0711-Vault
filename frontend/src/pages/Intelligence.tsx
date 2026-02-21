// P2-04: Intelligence Dashboard Tab
import React from "react";

interface IntelligenceStats {
  containersCreated: number;
  documentsProcessed: number;
  avgConfidence: number;
  citationsGenerated: number;
  extractionsThisMonth: number;
  extractionsLimit: number;
}

export function IntelligenceDashboard() {
  // Mock data - replace with API call
  const stats: IntelligenceStats = {
    containersCreated: 2847,
    documentsProcessed: 891,
    avgConfidence: 94.2,
    citationsGenerated: 147832,
    extractionsThisMonth: 3421,
    extractionsLimit: 5000
  };

  const recentExtractions = [
    { id: 1, filename: "Datenblatt_7739617397.pdf", status: "complete", containers: 1, time: "2 min ago" },
    { id: 2, filename: "Produktkatalog_2026.pdf", status: "processing", containers: 0, time: "5 min ago" },
    { id: 3, filename: "Technical_Specs_AWE.pdf", status: "complete", containers: 3, time: "1 hour ago" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Intelligence Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold">{stats.containersCreated.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Containers Created</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold">{stats.documentsProcessed}</div>
          <div className="text-gray-400 text-sm">Documents Processed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold">{stats.avgConfidence}%</div>
          <div className="text-gray-400 text-sm">Avg Confidence</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold">{(stats.citationsGenerated / 1000).toFixed(0)}K</div>
          <div className="text-gray-400 text-sm">Citations</div>
        </div>
      </div>

      {/* Usage Meter */}
      <div className="bg-gray-800 rounded-lg p-4 mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Monthly Extractions</span>
          <span className="text-sm">{stats.extractionsThisMonth} / {stats.extractionsLimit}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: (stats.extractionsThisMonth / stats.extractionsLimit * 100) + "%" }}
          />
        </div>
      </div>

      {/* Recent Extractions */}
      <div className="bg-gray-800 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-semibold">Recent Extractions</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {recentExtractions.map((ex) => (
            <div key={ex.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <div className="font-medium">{ex.filename}</div>
                  <div className="text-sm text-gray-400">{ex.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {ex.status === "complete" ? (
                  <span className="text-green-400 text-sm">{ex.containers} container(s)</span>
                ) : (
                  <span className="text-yellow-400 text-sm animate-pulse">Processing...</span>
                )}
                <button className="text-sm text-blue-400 hover:underline">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
