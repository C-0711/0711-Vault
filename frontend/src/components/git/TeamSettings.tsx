/**
 * PROJEKT GENESIS: Team Settings Component
 * Manage space members and access tokens
 */

import React, { useState, useEffect } from 'react';

interface Member {
  id: string;
  principal_type: string;
  principal_id: string;
  email: string | null;
  role: string;
  accepted: boolean;
}

interface Token {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  use_count: number;
  expires_at: string | null;
}

interface TeamSettingsProps {
  spaceId: string;
}

export function TeamSettings({ spaceId }: TeamSettingsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'tokens'>('members');
  
  // Add member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  
  // Add token form
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenScopes, setTokenScopes] = useState<string[]>(['read']);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [spaceId]);

  const fetchData = async () => {
    try {
      const [membersRes, tokensRes] = await Promise.all([
        fetch(`/publish/spaces/${spaceId}/members`),
        fetch(`/publish/spaces/${spaceId}/tokens`)
      ]);
      const membersData = await membersRes.json();
      const tokensData = await tokensRes.json();
      setMembers(membersData.members || []);
      setTokens(tokensData.tokens || []);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      await fetch(`/publish/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal_email: newEmail, role: newRole })
      });
      setShowAddMember(false);
      setNewEmail('');
      fetchData();
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await fetch(`/publish/spaces/${spaceId}/members/${memberId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleCreateToken = async () => {
    try {
      const res = await fetch(`/publish/spaces/${spaceId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName, scopes: tokenScopes })
      });
      const data = await res.json();
      setNewToken(data.token);
      setShowAddToken(false);
      setTokenName('');
      fetchData();
    } catch (err) {
      console.error('Failed to create token:', err);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Revoke this token? This cannot be undone.')) return;
    try {
      await fetch(`/publish/spaces/${spaceId}/tokens/${tokenId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-600';
      case 'admin': return 'bg-red-600';
      case 'editor': return 'bg-blue-600';
      case 'reviewer': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Token Alert */}
      {newToken && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-400">Token Created!</p>
              <p className="text-sm text-gray-400">Copy this token now - it won't be shown again.</p>
            </div>
            <button onClick={() => setNewToken(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 bg-gray-900 px-3 py-2 rounded font-mono text-sm">{newToken}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newToken);
                alert('Copied!');
              }}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded"
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 rounded ${activeTab === 'members' ? 'bg-gray-700' : ''}`}
        >
          👥 Team Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 py-2 rounded ${activeTab === 'tokens' ? 'bg-gray-700' : ''}`}
        >
          🔑 API Tokens ({tokens.length})
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-gray-800 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-medium">Team Members</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm"
            >
              + Invite
            </button>
          </div>

          {showAddMember && (
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 bg-gray-700 rounded px-3 py-2"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                  Invite
                </button>
                <button onClick={() => setShowAddMember(false)} className="text-gray-400 px-2">✕</button>
              </div>
            </div>
          )}

          {members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No team members yet. Invite someone to collaborate!
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {members.map((member) => (
                <div key={member.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      {member.email ? member.email[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-medium">{member.email || member.principal_id}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        {!member.accepted && (
                          <span className="text-xs text-yellow-500">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="bg-gray-800 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-medium">API Tokens</h3>
            <button
              onClick={() => setShowAddToken(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm"
            >
              + Create Token
            </button>
          </div>

          {showAddToken && (
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <div className="space-y-3">
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Token name (e.g., CI/CD)"
                  className="w-full bg-gray-700 rounded px-3 py-2"
                />
                <div className="flex gap-2">
                  {['read', 'write', 'publish', 'admin'].map((scope) => (
                    <label key={scope} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={tokenScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTokenScopes([...tokenScopes, scope]);
                          } else {
                            setTokenScopes(tokenScopes.filter(s => s !== scope));
                          }
                        }}
                      />
                      {scope}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateToken} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Create
                  </button>
                  <button onClick={() => setShowAddToken(false)} className="text-gray-400 px-2">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {tokens.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No API tokens. Create one for CI/CD integration.
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {tokens.map((token) => (
                <div key={token.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <code>{token.prefix}...</code>
                      <span>•</span>
                      <span>{token.scopes.join(', ')}</span>
                      {token.last_used_at && (
                        <>
                          <span>•</span>
                          <span>Used {token.use_count}x</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeToken(token.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamSettings;
