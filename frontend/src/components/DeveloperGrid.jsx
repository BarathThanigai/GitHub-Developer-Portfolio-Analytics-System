import { useState } from "react";
import UserDetailModal from "./UserDetailModal";

function formatNum(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

function DevCard({ dev, rank, maxScore, onClick }) {
  const skills = dev.skills ? dev.skills.split(", ").filter(Boolean) : [];
  const score = Number(dev.computed_score) || 0;
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  const isTop = rank <= 3;

  return (
    <div className="dev-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className={`dev-rank ${isTop ? "top" : ""}`}>#{rank}</div>

      <div className="dev-header">
        <div className="dev-avatar">{getInitials(dev.username)}</div>
        <div className="dev-info">
          <div className="dev-username">
            {dev.username}
            {isTop && <span style={{ fontSize: 10, color: "var(--accent)", opacity: 0.7 }}>★</span>}
          </div>
          <div className="dev-location">
            {dev.location ? `⊕ ${dev.location}` : "⊕ Unknown"}
            <span style={{ marginLeft: 8 }}>
              {dev.followers ? `↑ ${formatNum(dev.followers)}` : ""}
            </span>
          </div>
        </div>
      </div>

      {dev.bio && <div className="dev-bio">{dev.bio}</div>}

      <div className="dev-skills">
        {skills.slice(0, 6).map((skill, i) => (
          <span key={skill} className={`skill-tag ${i === 0 ? "primary" : ""}`}>
            {skill}
          </span>
        ))}
        {skills.length > 6 && (
          <span className="skill-tag">+{skills.length - 6}</span>
        )}
      </div>

      <div className="dev-metrics">
        <div className="metric">
          <div className="metric-val score">{formatNum(score)}</div>
          <div className="metric-key">SCORE</div>
        </div>
        <div className="metric">
          <div className="metric-val green">{formatNum(dev.total_commits)}</div>
          <div className="metric-key">COMMITS</div>
        </div>
        <div className="metric">
          <div className="metric-val">{formatNum(dev.total_stars)}</div>
          <div className="metric-key">STARS</div>
        </div>
        <div className="metric">
          <div className="metric-val">{formatNum(dev.total_prs)}</div>
          <div className="metric-key">PRS</div>
        </div>
      </div>

      <div className="score-bar-wrap">
        <div className="score-bar-label">
          <span>MATCH SCORE</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function DeveloperGrid({ developers, isSearchResult }) {
  const [selectedUserId, setSelectedUserId] = useState(null);

  if (!developers || developers.length === 0) {
    return (
      <div className="dev-grid">
        <div className="empty-state">
          <div className="empty-icon">{isSearchResult ? "⌀" : "◈"}</div>
          <div className="empty-title">
            {isSearchResult ? "No matching developers found" : "No developers indexed yet"}
          </div>
          <div className="empty-sub">
            {isSearchResult
              ? "Try a different query or broaden your search criteria"
              : "Import developer data into your MySQL database to get started"}
          </div>
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...developers.map((d) => Number(d.computed_score) || 0), 1);

  return (
    <>
      <div className="dev-grid">
        {developers.map((dev, i) => (
          <DevCard
            key={dev.user_id || dev.id || i}
            dev={dev}
            rank={i + 1}
            maxScore={maxScore}
            onClick={() => setSelectedUserId(dev.user_id)}
          />
        ))}
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}