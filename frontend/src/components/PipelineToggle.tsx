// P2-02: Pipeline Toggle Component
import React, { useState } from "react";

interface PipelineToggleProps {
  enabled: boolean;
  edition: "core" | "intelligence" | "enterprise";
  onToggle: (enabled: boolean) => void;
  onUpgrade: () => void;
}

export function PipelineToggle({ enabled, edition, onToggle, onUpgrade }: PipelineToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const canToggle = edition !== "core";

  const handleToggle = async () => {
    if (!canToggle) {
      onUpgrade();
      return;
    }
    setIsLoading(true);
    try {
      await onToggle(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            ⚡ Intelligence Pipeline
            {enabled && <span className="text-xs bg-green-600 px-2 py-0.5 rounded">ACTIVE</span>}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Automatically extract product data from uploaded documents
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            canToggle
              ? enabled ? "bg-green-600" : "bg-gray-600"
              : "bg-gray-700 cursor-not-allowed"
          }`}
        >
          <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-7" : "translate-x-1"
          }`} />
          {!canToggle && <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>}
        </button>
      </div>

      {!canToggle && (
        <div className="mt-4 p-4 border border-yellow-600/50 bg-yellow-900/20 rounded">
          <p className="text-yellow-200 text-sm">
            Intelligence Pipeline requires <strong>Vault Intelligence</strong> or higher.
          </p>
          <button
            onClick={onUpgrade}
            className="mt-2 px-4 py-2 bg-yellow-600 text-black text-sm font-semibold rounded hover:bg-yellow-500"
          >
            Upgrade — €499/mo
          </button>
        </div>
      )}

      {canToggle && enabled && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 bg-gray-800 rounded">
            <div className="text-2xl font-bold">2,847</div>
            <div className="text-gray-400">Containers</div>
          </div>
          <div className="p-3 bg-gray-800 rounded">
            <div className="text-2xl font-bold">891</div>
            <div className="text-gray-400">Documents</div>
          </div>
          <div className="p-3 bg-gray-800 rounded">
            <div className="text-2xl font-bold">94.2%</div>
            <div className="text-gray-400">Confidence</div>
          </div>
        </div>
      )}
    </div>
  );
}
