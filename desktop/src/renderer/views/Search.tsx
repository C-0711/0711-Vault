/**
 * Search View - Global semantic search with Cmd+K
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Search as SearchIcon, Image, FileText, Clock, X } from 'lucide-react';

interface SearchResult {
  id: string;
  item_type: string;
  encrypted_metadata: string | null;
  storage_key: string;
  similarity: number;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);
  
  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const response = await api.search(q, 20);
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data.results || []);
    },
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    
    searchMutation.mutate(query.trim());
  };
  
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };
  
  return (
    <div className="h-full flex flex-col p-6">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto w-full mb-8">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search photos, documents, people... (⌘K)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted border border-border focus:border-primary focus:outline-none text-lg"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
        
        {/* Search tips */}
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Try: "beach sunset" • "photos with mom" • "documents from 2024" • "birthday party"
        </p>
      </div>
      
      {/* Results or Recent */}
      <div className="flex-1 overflow-auto">
        {results.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              <span className="text-sm text-muted-foreground">{results.length} items found</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        ) : searchMutation.isPending ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : query && searchMutation.isSuccess ? (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{query}"</p>
            <p className="text-sm mt-2">Try different keywords or check your spelling</p>
          </div>
        ) : recentSearches.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Searches
              </h2>
              <button onClick={clearRecent} className="text-sm text-muted-foreground hover:text-foreground">
                Clear all
              </button>
            </div>
            
            <div className="space-y-2">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(search);
                    searchMutation.mutate(search);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start typing to search your vault</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const [loaded, setLoaded] = useState(false);
  
  const isPhoto = result.item_type === 'photo';
  const similarity = Math.round(result.similarity * 100);
  
  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary">
      {isPhoto ? (
        <>
          {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <img
            src={`https://api-vault.0711.io/vault/items/${result.id}/thumbnail`}
            alt=""
            className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      
      {/* Similarity badge */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
        {similarity}%
      </div>
      
      {/* Type badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
        {isPhoto ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
        {result.item_type}
      </div>
    </div>
  );
}
