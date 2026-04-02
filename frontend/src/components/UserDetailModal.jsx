import { useState, useEffect } from "react";
import "./UserDetailModal.css";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function getInitials(username) {
  return username ? username.slice(0, 2).toUpperCase() : "??";
}

const STATUS_COLOR = {
  merged: "status-merged",
  open:   "status-open",
  closed: "status-closed",
};

export default function UserDetailModal({ userId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [tab, setTab]       = useState("overview"); // overview | repos | commits | prs

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/developers/${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // Close on backdrop click or Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* ── Close ── */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {loading && (
          <div className="modal-loading">
            <div className="modal-spinner" />
            <span>Loading profile...</span>
          </div>
        )}

        {error && (
          <div className="modal-error">⚠ {error}</div>
        )}

        {data && !loading && (
          <>
            {/* ── Profile Header ── */}
            <div className="modal-header">
              <div className="modal-avatar">
                {getInitials(data.user.username)}
              </div>
              <div className="modal-identity">
                <h2 className="modal-username">{data.user.username}</h2>
                <div className="modal-meta">
                  {data.user.email && <span>✉ {data.user.email}</span>}
                  {(data.user.state || data.user.country) && (
                    <span>⊕ {[data.user.state, data.user.country].filter(Boolean).join(", ")}</span>
                  )}
                  {data.user.followers_count > 0 && (
                    <span>↑ {fmt(data.user.followers_count)} followers</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Aggregate Stats ── */}
            <div className="modal-stats">
              {[
                { label: "Repos",      value: fmt(data.stats.total_repos) },
                { label: "Stars",      value: fmt(data.stats.total_stars) },
                { label: "Commits",    value: fmt(data.stats.total_commits) },
                { label: "Lines Added",value: fmt(data.stats.total_lines_added) },
                { label: "Merged PRs", value: fmt(data.stats.merged_prs) },
                { label: "Open PRs",   value: fmt(data.stats.open_prs) },
              ].map(s => (
                <div className="mstat" key={s.label}>
                  <div className="mstat-val">{s.value}</div>
                  <div className="mstat-key">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Language Bar ── */}
            {data.languages.length > 0 && (
              <div className="lang-section">
                <div className="lang-bar">
                  {data.languages.slice(0, 6).map((l, i) => (
                    <div
                      key={l.language_name}
                      className={`lang-seg seg-${i}`}
                      style={{ width: `${l.avg_usage}%` }}
                      title={`${l.language_name} — ${l.avg_usage}%`}
                    />
                  ))}
                </div>
                <div className="lang-legend">
                  {data.languages.slice(0, 6).map((l, i) => (
                    <span key={l.language_name} className="lang-item">
                      <span className={`lang-dot seg-${i}`} />
                      {l.language_name}
                      <span className="lang-pct">{l.avg_usage}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="modal-tabs">
              {["overview", "repos", "commits", "prs"].map(t => (
                <button
                  key={t}
                  className={`modal-tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "prs" ? "Pull Requests" : t.charAt(0).toUpperCase() + t.slice(1)}
                  <span className="modal-tab-count">
                    {t === "repos"    && data.repos.length}
                    {t === "commits"  && data.commits.length}
                    {t === "prs"      && data.pullRequests.length}
                    {t === "overview" && ""}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ── */}
            {tab === "overview" && (
              <div className="tab-content">
                <div className="overview-grid">
                  <div className="overview-card">
                    <div className="ov-title">Top Languages</div>
                    {data.languages.slice(0, 5).map(l => (
                      <div className="ov-lang-row" key={l.language_name}>
                        <span className="ov-lang-name">{l.language_name}</span>
                        <div className="ov-lang-track">
                          <div className="ov-lang-fill" style={{ width: `${Math.min(l.avg_usage, 100)}%` }} />
                        </div>
                        <span className="ov-lang-pct">{l.avg_usage}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="overview-card">
                    <div className="ov-title">Top Repositories</div>
                    {data.repos.slice(0, 4).map(r => (
                      <div className="ov-repo-row" key={r.repo_id}>
                        <div className="ov-repo-name">{r.repo_name}</div>
                        <div className="ov-repo-meta">
                          <span>★ {r.stars_count}</span>
                          <span>⑂ {r.forks_count}</span>
                          <span className={`vis-badge ${r.visibility}`}>{r.visibility}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Repos ── */}
            {tab === "repos" && (
              <div className="tab-content">
                {data.repos.length === 0
                  ? <div className="tab-empty">No repositories found.</div>
                  : data.repos.map(r => (
                    <div className="detail-row" key={r.repo_id}>
                      <div className="detail-row-main">
                        <span className="detail-name">{r.repo_name}</span>
                        <span className={`vis-badge ${r.visibility}`}>{r.visibility}</span>
                        {r.parent_repo_id && <span className="forked-badge">forked</span>}
                      </div>
                      <div className="detail-row-meta">
                        {r.languages && <span>{r.languages}</span>}
                        <span>★ {r.stars_count}</span>
                        <span>⑂ {r.forks_count}</span>
                        <span>{timeAgo(r.created_at)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── Tab: Commits ── */}
            {tab === "commits" && (
              <div className="tab-content">
                {data.commits.length === 0
                  ? <div className="tab-empty">No commits found.</div>
                  : data.commits.map(c => (
                    <div className="detail-row" key={c.commit_id}>
                      <div className="detail-row-main">
                        <span className="commit-hash">{c.commit_id?.slice(0, 7)}</span>
                        <span className="detail-name">{c.commit_message || "(no message)"}</span>
                      </div>
                      <div className="detail-row-meta">
                        <span className="repo-ref">{c.repo_name}</span>
                        <span className="lines-added">+{c.lines_added}</span>
                        <span className="lines-deleted">-{c.lines_deleted}</span>
                        <span>{timeAgo(c.commit_time)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── Tab: PRs ── */}
            {tab === "prs" && (
              <div className="tab-content">
                {data.pullRequests.length === 0
                  ? <div className="tab-empty">No pull requests found.</div>
                  : data.pullRequests.map(pr => (
                    <div className="detail-row" key={pr.pr_id}>
                      <div className="detail-row-main">
                        <span className={`status-badge ${STATUS_COLOR[pr.status]}`}>
                          {pr.status}
                        </span>
                        <span className="repo-ref">{pr.repo_name}</span>
                      </div>
                      <div className="detail-row-meta">
                        <span>Opened {timeAgo(pr.created_at)}</span>
                        {pr.merged_at && <span>Merged {timeAgo(pr.merged_at)}</span>}
                        {pr.closed_at && !pr.merged_at && <span>Closed {timeAgo(pr.closed_at)}</span>}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}