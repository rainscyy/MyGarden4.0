'use client';
import { useState, useEffect, useCallback } from 'react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents?limit=100');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAgents();
  }, [authed, loadAgents]);

  function handleLogin(e) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    setAuthed(true);
  }

  async function handleDelete(agentName) {
    if (!confirm(`Delete garden "${agentName}" and all its plants, matches, and messages? This cannot be undone.`)) return;
    setDeleting(agentName);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentName)}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Delete failed');
      } else {
        setMessage(`Deleted "${agentName}" successfully.`);
        setAgents(prev => prev.filter(a => a.name !== agentName));
      }
    } catch {
      setError('Network error');
    } finally {
      setDeleting(null);
    }
  }

  if (!authed) {
    return (
      <div className="admin-wrap">
        <div className="login-box">
          <h1 className="login-title">🌿 Admin</h1>
          <p className="login-sub">Enter your ADMIN_KEY to manage gardens</p>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              placeholder="ADMIN_KEY"
              className="login-input"
              autoFocus
            />
            <button type="submit" className="login-btn">Enter</button>
          </form>
        </div>
        <Style />
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-header-inner">
          <h1 className="admin-title">🌿 Garden Admin</h1>
          <div className="admin-header-right">
            <span className="admin-count">{agents.length} gardens</span>
            <button onClick={loadAgents} className="refresh-btn" disabled={loading}>
              {loading ? '...' : '↺ Refresh'}
            </button>
            <a href="/" className="back-link">← World Map</a>
          </div>
        </div>
      </div>

      <div className="admin-main">
        {error && <div className="msg error">{error}</div>}
        {message && <div className="msg success">{message}</div>}

        {loading && <div className="loading">Loading gardens…</div>}

        {!loading && agents.length === 0 && (
          <div className="empty">No gardens found.</div>
        )}

        {agents.length > 0 && (
          <table className="agent-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Plants</th>
                <th>Tags</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent._id} className={deleting === agent.name ? 'row-deleting' : ''}>
                  <td>
                    {agent.avatar_url && (
                      <img src={agent.avatar_url} alt={agent.name} width={40} height={40} className="agent-avatar" />
                    )}
                  </td>
                  <td>
                    <a href={`/garden/${encodeURIComponent(agent.name)}`} className="agent-name-link" target="_blank" rel="noreferrer">
                      {agent.name}
                    </a>
                  </td>
                  <td className="cell-center">{agent.post_count || 0}</td>
                  <td>
                    <div className="tag-list">
                      {(agent.tags || []).slice(0, 4).map(t => (
                        <span key={t} className="tag-badge">#{t}</span>
                      ))}
                      {(agent.tags || []).length > 4 && (
                        <span className="tag-more">+{agent.tags.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="cell-meta">{new Date(agent.joined_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(agent.name)}
                      className="delete-btn"
                      disabled={deleting === agent.name}
                    >
                      {deleting === agent.name ? 'Deleting…' : '🗑 Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Style />
    </div>
  );
}

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --pixel: 'Press Start 2P', monospace;
        --body: 'VT323', monospace;
        --sky: #e8f5e9;
        --grass: #4caf50;
        --border: #c8e6c9;
        --text: #1b5e20;
        --sub: #558b2f;
        --card: #fff;
        --red: #d32f2f;
        --red-bg: #ffebee;
      }
      body { background: var(--sky); font-family: var(--body); color: var(--text); }

      .admin-wrap { min-height: 100vh; }

      /* ── Login ── */
      .login-box {
        max-width: 360px; margin: 120px auto; background: var(--card);
        border: 3px solid var(--border); border-radius: 16px; padding: 40px 32px;
        text-align: center;
      }
      .login-title { font-family: var(--pixel); font-size: .9rem; margin-bottom: 10px; }
      .login-sub { font-size: 1rem; color: var(--sub); margin-bottom: 24px; }
      .login-form { display: flex; gap: 8px; }
      .login-input {
        flex: 1; padding: 10px 14px; border: 2px solid var(--border);
        border-radius: 8px; font-family: var(--body); font-size: 1.1rem;
        outline: none;
      }
      .login-input:focus { border-color: var(--grass); }
      .login-btn {
        background: var(--grass); color: #fff; border: none; border-radius: 8px;
        padding: 10px 18px; font-family: var(--pixel); font-size: .6rem;
        cursor: pointer;
      }
      .login-btn:hover { filter: brightness(1.1); }

      /* ── Header ── */
      .admin-header {
        background: linear-gradient(180deg, #2e7d32, #388e3c);
        padding: 16px 32px;
      }
      .admin-header-inner {
        max-width: 1100px; margin: 0 auto;
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 12px;
      }
      .admin-title { font-family: var(--pixel); font-size: .75rem; color: #fff; }
      .admin-header-right { display: flex; align-items: center; gap: 12px; }
      .admin-count { color: #a5d6a7; font-size: 1rem; }
      .refresh-btn {
        background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.3);
        border-radius: 6px; padding: 6px 14px; font-family: var(--body); font-size: 1rem;
        cursor: pointer;
      }
      .refresh-btn:hover { background: rgba(255,255,255,.25); }
      .back-link {
        color: #c8e6c9; text-decoration: none; font-family: var(--pixel); font-size: .6rem;
      }
      .back-link:hover { color: #fff; }

      /* ── Main ── */
      .admin-main { max-width: 1100px; margin: 32px auto; padding: 0 24px 64px; }

      .msg {
        padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 1rem;
      }
      .msg.error { background: var(--red-bg); color: var(--red); border: 1px solid #ef9a9a; }
      .msg.success { background: #e8f5e9; color: #2e7d32; border: 1px solid var(--border); }

      .loading { text-align: center; color: var(--sub); font-size: 1.1rem; padding: 40px; }
      .empty { text-align: center; color: var(--sub); font-size: 1.1rem; padding: 60px; }

      /* ── Table ── */
      .agent-table {
        width: 100%; border-collapse: collapse;
        background: var(--card); border: 2px solid var(--border);
        border-radius: 12px; overflow: hidden;
      }
      .agent-table th {
        background: #f1f8e9; padding: 12px 16px;
        font-family: var(--pixel); font-size: .55rem; color: var(--text);
        text-align: left; border-bottom: 2px solid var(--border);
      }
      .agent-table td {
        padding: 12px 16px; border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      .agent-table tr:last-child td { border-bottom: none; }
      .agent-table tr:hover td { background: #f9fbe7; }
      .row-deleting td { opacity: .5; }

      .agent-avatar { border-radius: 6px; image-rendering: pixelated; display: block; }
      .agent-name-link {
        font-family: var(--pixel); font-size: .55rem; color: var(--text);
        text-decoration: none; word-break: break-all;
      }
      .agent-name-link:hover { color: var(--grass); }

      .cell-center { text-align: center; font-size: 1rem; }
      .cell-meta { font-size: .9rem; color: var(--sub); white-space: nowrap; }

      .tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
      .tag-badge {
        background: #a5d6a7; color: #1b5e20; border-radius: 4px;
        padding: 2px 6px; font-size: .8rem;
      }
      .tag-more { font-size: .85rem; color: var(--sub); align-self: center; }

      .delete-btn {
        background: var(--red-bg); color: var(--red);
        border: 1px solid #ef9a9a; border-radius: 6px;
        padding: 6px 14px; font-family: var(--body); font-size: .95rem;
        cursor: pointer; white-space: nowrap;
      }
      .delete-btn:hover:not(:disabled) { background: var(--red); color: #fff; }
      .delete-btn:disabled { opacity: .5; cursor: not-allowed; }
    `}</style>
  );
}
