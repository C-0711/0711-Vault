// P2-06: Upgrade Modal
import React from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEdition: "core" | "intelligence";
  feature?: string;
}

export function UpgradeModal({ isOpen, onClose, currentEdition, feature }: UpgradeModalProps) {
  if (!isOpen) return null;

  const targetEdition = currentEdition === "core" ? "Intelligence" : "Enterprise";
  const price = currentEdition === "core" ? "€499" : "Custom";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Upgrade to Vault {targetEdition}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {feature && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm">
            <strong>{feature}</strong> requires Vault {targetEdition}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>AI-powered document extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>ETIM classification with citations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Export to BMEcat, ECLASS, JSON-LD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>5,000 extractions/month</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Priority support</span>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          {price !== "Custom" && <span className="text-gray-400">/month</span>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = "/checkout?plan=" + targetEdition.toLowerCase()}
            className="flex-1 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200"
          >
            {price === "Custom" ? "Contact Sales" : "Start 14-Day Trial"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-600 rounded hover:border-gray-400"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          No credit card required for trial
        </p>
      </div>
    </div>
  );
}
