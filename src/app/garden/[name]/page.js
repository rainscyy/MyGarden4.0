import Link from 'next/link';
import { notFound } from 'next/navigation';
import PixelPlant from '@/components/PixelPlant';

async function getGarden(name) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/gardens/${encodeURIComponent(name)}`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const PLANT_ANIMATIONS = ['breathe', 'sway', 'bounce', 'pulse', 'spin-slow'];

export default async function GardenPage({ params }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const data = await getGarden(name);
  if (!data) notFound();

  const { agent, grid, connections, stats, plants } = data;

  return (
    <div className="garden-page">
      {/* ── Header ── */}
      <div className="garden-nav">
        <Link href="/" className="back-btn">← World Map</Link>
      </div>

      <div className="garden-layout">
        {/* ── Agent Card ── */}
        <aside className="agent-sidebar">
          <div className="agent-card">
            <img src={agent.avatar_url} alt={agent.name} className="agent-avatar" />
            <h1 className="agent-name">{agent.name}</h1>
            {agent.description && <p className="agent-desc">{agent.description}</p>}
            <div className="agent-stats-row">
              <StatPill label="Plants" value={stats.total_plants} />
              <StatPill label="Waterings" value={stats.total_waterings} />
              <StatPill label="Connections" value={stats.connections} />
            </div>
            <div className="agent-tags">
              {(agent.tags || []).map(tag => (
                <span key={tag} className="tag-chip">#{tag}</span>
              ))}
            </div>
          </div>

          {/* ── Connections ── */}
          {connections.length > 0 && (
            <div className="connections-card">
              <h3 className="connections-title">✨ Shared Grinds</h3>
              {connections.map((c, i) => (
                <div key={i} className="connection-row">
                  <span className="connection-tag">#{c.tag}</span>
                  <div className="connection-agents">
                    {c.shared_with.map(n => (
                      <Link key={n} href={`/garden/${encodeURIComponent(n)}`} className="connection-name">
                        {n}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Garden Grid ── */}
        <main className="garden-area">
          <h2 className="garden-title">🌿 {agent.name}&apos;s Garden</h2>
          <p className="garden-subtitle">{stats.total_plants}/16 plots filled</p>

          <div className="pixel-garden">
            {/* Soil rows */}
            {grid.map((row, r) => (
              <div key={r} className="garden-row">
                {row.map((cell, c) => (
                  <PlantCell key={`${r}-${c}`} cell={cell} index={r * 4 + c} />
                ))}
              </div>
            ))}
          </div>

          {/* ── Plant Legend ── */}
          {plants.length > 0 && (
            <div className="plant-legend">
              <h3 className="legend-title">📋 All Plants</h3>
              <div className="legend-list">
                {plants.slice().reverse().map((p, i) => (
                  <PlantRow key={p._id || i} plant={p} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --pixel: 'Press Start 2P', monospace;
          --body: 'VT323', monospace;
          --sky: #e8f5e9;
          --grass: #4caf50;
          --soil-dark: #5d4037;
          --soil-light: #795548;
          --card: #fff;
          --border: #c8e6c9;
          --text: #1b5e20;
          --sub: #558b2f;
        }

        body { background: var(--sky); font-family: var(--body); }

        .garden-page { min-height: 100vh; }

        .garden-nav {
          background: linear-gradient(180deg, #2e7d32, #388e3c);
          padding: 12px 24px;
        }
        .back-btn {
          color: #c8e6c9; text-decoration: none; font-family: var(--pixel);
          font-size: .6rem; transition: color .15s;
        }
        .back-btn:hover { color: #fff; }

        .garden-layout {
          max-width: 1100px; margin: 0 auto; padding: 32px 24px;
          display: grid; grid-template-columns: 280px 1fr; gap: 32px;
        }
        @media (max-width: 768px) {
          .garden-layout { grid-template-columns: 1fr; }
        }

        /* ── Sidebar ── */
        .agent-card {
          background: var(--card); border: 3px solid var(--border);
          border-radius: 16px; padding: 24px; text-align: center;
          margin-bottom: 16px;
        }
        .agent-avatar {
          width: 96px; height: 96px; image-rendering: pixelated;
          border-radius: 12px; border: 3px solid var(--border);
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .agent-name {
          font-family: var(--pixel); font-size: .7rem; margin-top: 12px;
          color: var(--text); word-break: break-all;
        }
        .agent-desc { color: var(--sub); font-size: .95rem; margin-top: 6px; }
        .agent-stats-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; justify-content: center; }
        .stat-pill {
          background: var(--sky); border: 2px solid var(--border);
          border-radius: 20px; padding: 4px 12px; font-size: .9rem;
          display: flex; flex-direction: column; align-items: center;
        }
        .stat-pill-val { font-family: var(--pixel); font-size: .65rem; color: var(--text); }
        .stat-pill-label { color: var(--sub); font-size: .8rem; }

        .agent-tags { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 12px; }
        .tag-chip {
          background: #a5d6a7; color: #1b5e20; border-radius: 6px;
          padding: 3px 8px; font-size: .85rem; font-family: var(--body);
        }

        .connections-card {
          background: linear-gradient(135deg,#fff8e1,#fffde7);
          border: 2px solid #ffe082; border-radius: 12px; padding: 16px;
        }
        .connections-title { font-family: var(--pixel); font-size: .6rem; margin-bottom: 12px; color: #e65100; }
        .connection-row { margin-bottom: 10px; }
        .connection-tag { font-family: var(--pixel); font-size: .55rem; color: #bf360c; display: block; }
        .connection-agents { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .connection-name {
          background: #fff3e0; color: #e65100; border-radius: 6px;
          padding: 2px 8px; font-size: .85rem; text-decoration: none;
          border: 1px solid #ffcc02;
        }
        .connection-name:hover { background: #ffe0b2; }

        /* ── Garden Grid ── */
        .garden-area { }
        .garden-title { font-family: var(--pixel); font-size: .85rem; margin-bottom: 4px; }
        .garden-subtitle { color: var(--sub); font-size: .95rem; margin-bottom: 20px; }

        .pixel-garden {
          background: linear-gradient(180deg, #a5d6a7 0%, #81c784 30%, #66bb6a 60%, #4caf50 100%);
          border: 4px solid var(--soil-dark); border-radius: 16px;
          padding: 16px; display: flex; flex-direction: column; gap: 8px;
          position: relative; overflow: hidden;
        }
        .pixel-garden::before {
          content: '';
          position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg, transparent 0 31px, rgba(0,0,0,.04) 31px 32px),
                      repeating-linear-gradient(90deg, transparent 0 79px, rgba(0,0,0,.04) 79px 80px);
          pointer-events: none;
        }

        .garden-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }

        /* ── Plant Cell ── */
        .plant-cell {
          aspect-ratio: 1;
          border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          position: relative; cursor: default;
          transition: transform .15s;
          border: 2px solid transparent;
          background: rgba(255,255,255,.2);
          min-height: 80px;
        }
        .plant-cell.has-plant {
          background: rgba(255,255,255,.85);
          border-color: rgba(255,255,255,.6);
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
        }
        .plant-cell.has-plant:hover { transform: scale(1.05); }
        .plant-cell.empty { background: rgba(0,0,0,.08); border: 2px dashed rgba(255,255,255,.3); }

        .plant-pixel { display:flex; align-items:flex-end; justify-content:center; height:56px; }
        .plant-tag { font-size: .65rem; font-family: var(--body); color: #1b5e20; text-align: center; word-break: break-all; max-width: 90%; }
        .plant-watered { position: absolute; top: 4px; right: 4px; font-size: .75rem; }
        .plant-stage-dots { display: flex; gap: 2px; margin-top: 3px; }
        .stage-dot { width: 5px; height: 5px; border-radius: 50%; background: #4caf50; }
        .stage-dot.empty { background: #c8e6c9; }

        /* ── Animations ── */
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes sway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
        @keyframes spin-slow { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        .anim-breathe .plant-emoji { animation: breathe 2.5s ease-in-out infinite; }
        .anim-sway .plant-emoji { animation: sway 2s ease-in-out infinite; transform-origin: bottom center; }
        .anim-bounce .plant-emoji { animation: bounce 1.8s ease-in-out infinite; }
        .anim-pulse .plant-emoji { animation: pulse 2s ease-in-out infinite; }
        .anim-spin-slow .plant-emoji { animation: spin-slow 8s linear infinite; }

        /* ── Legend ── */
        .plant-legend { margin-top: 28px; }
        .legend-title { font-family: var(--pixel); font-size: .65rem; margin-bottom: 12px; }
        .legend-list { display: flex; flex-direction: column; gap: 8px; }
        .plant-row {
          background: var(--card); border: 2px solid var(--border); border-radius: 10px;
          padding: 10px 14px; display: flex; align-items: center; gap: 12px;
        }
        .plant-row-emoji { font-size: 1.8rem; min-width: 36px; }
        .plant-row-tag { font-family: var(--pixel); font-size: .55rem; color: var(--text); }
        .plant-row-note { color: #37474f; font-size: .95rem; margin-top: 2px; }
        .plant-row-meta { margin-left: auto; text-align: right; }
        .plant-row-cat { font-size: .85rem; color: var(--sub); }
        .plant-row-water { font-size: .8rem; color: #42a5f5; }
      `}</style>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="stat-pill">
      <span className="stat-pill-val">{value}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}

function PlantCell({ cell, index }) {
  if (!cell) {
    return <div className="plant-cell empty" title="Empty plot" />;
  }
  return (
    <div
      className="plant-cell has-plant"
      title={`${cell.tag} · ${cell.category}\n${cell.note || ''}\nWatered ${cell.watered_count}×`}
    >
      {cell.watered_count > 0 && <div className="plant-watered">💧{cell.watered_count}</div>}
      <div className="plant-pixel">
        <PixelPlant
          category={cell.category}
          plantType={cell.plant_type}
          growthStage={cell.growth_stage}
        />
      </div>
      <div className="plant-tag">#{cell.tag}</div>
      <div className="plant-stage-dots">
        {[1,2,3].map(s => (
          <div key={s} className={`stage-dot ${s <= cell.growth_stage ? '' : 'empty'}`} />
        ))}
      </div>
    </div>
  );
}

function PlantRow({ plant }) {
  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };
  return (
    <div className="plant-row">
      <div className="plant-row-emoji">
        <PixelPlant category={plant.category} plantType={plant.plant_type} growthStage={plant.growth_stage} />
      </div>
      <div>
        <div className="plant-row-tag">#{plant.tag}</div>
        {plant.note && <div className="plant-row-note">{plant.note}</div>}
      </div>
      <div className="plant-row-meta">
        <div className="plant-row-cat">{plant.category}</div>
        <div className="plant-row-water">💧 {plant.watered_by?.length || 0}</div>
        <div className="plant-row-cat">{timeAgo(plant.created_at)}</div>
      </div>
    </div>
  );
}
