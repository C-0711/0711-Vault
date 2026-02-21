/**
 * PROJEKT GENESIS: Review List Component
 * Display and manage pull request-style reviews
 */

import React, { useState, useEffect } from 'react';
import { getReviews, createReview, mergeReview, getBranches } from '../../lib/api';

interface Review {
  id: string;
  number: number;
  title: string;
  status: 'open' | 'approved' | 'merged' | 'closed';
  created_at: string;
}

interface ReviewListProps {
  spaceId: string;
  onCreateReview?: () => void;
}

export function ReviewList({ spaceId, onCreateReview }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'merged' | 'closed'>('open');
  
  // Create form
  const [title, setTitle] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('main');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchBranches();
  }, [spaceId, filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviews(spaceId, filter === 'all' ? undefined : filter);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await getBranches(spaceId);
      setBranches((data.branches || []).map((b: any) => b.name));
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !sourceBranch) return;
    setCreating(true);
    try {
      await createReview(spaceId, title, sourceBranch, targetBranch, description);
      setShowCreate(false);
      setTitle('');
      setSourceBranch('');
      setDescription('');
      fetchReviews();
      onCreateReview?.();
    } catch (err) {
      console.error('Failed to create review:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleMerge = async (reviewId: string) => {
    if (!confirm('Merge this review?')) return;
    try {
      await mergeReview(spaceId, reviewId);
      fetchReviews();
    } catch (err) {
      console.error('Failed to merge:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Open</span>;
      case 'merged':
        return <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">Merged</span>;
      case 'closed':
        return <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">Closed</span>;
      default:
        return <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-medium flex items-center gap-2">
            <span>🔀</span>
            Reviews
          </h2>
          
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-700 rounded p-0.5 text-sm">
            {(['open', 'merged', 'closed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded capitalize ${
                  filter === f ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm"
        >
          + New Review
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">New Review</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review title"
                className="w-full bg-gray-700 rounded px-4 py-2"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">From</label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="">Select branch</option>
                    {branches.filter(b => b !== targetBranch).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Into</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-gray-700 rounded px-4 py-2 h-24 resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !sourceBranch}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded"
              >
                {creating ? 'Creating...' : 'Create Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🔀</div>
          <p>No {filter === 'all' ? '' : filter} reviews</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {reviews.map((review) => (
            <div key={review.id} className="px-4 py-3 hover:bg-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge(review.status)}
                  <span className="text-gray-500">#{review.number}</span>
                  <span className="font-medium">{review.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                  {review.status === 'open' && (
                    <button
                      onClick={() => handleMerge(review.id)}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                    >
                      Merge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewList;
