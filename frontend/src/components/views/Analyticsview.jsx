const LANG_COLORS = [
  "#58a6ff","#3fb950","#bc8ef9","#d29922","#f85149",
  "#39d353","#79c0ff","#56d364","#ff7b72","#ffa657",
];

export default function AnalyticsView({ developers, languages }) {
  const total      = developers.length || 1;
  const avgCommits = Math.round(developers.reduce((s, d) => s + Number(d.total_commits  || 0), 0) / total);
  const avgStars   = Math.round(developers.reduce((s, d) => s + Number(d.total_stars    || 0), 0) / total);
  const avgScore   = Math.round(developers.reduce((s, d) => s + Number(d.computed_score || 0), 0) / total);
  const totalLines = developers.reduce((s, d) => s + Number(d.total_lines || 0), 0);

  const maxRepoCount = languages[0]?.repo_count || 1;

  const topByScore = [...developers]
    .sort((a, b) => Number(b.computed_score) - Number(a.computed_score))
    .slice(0, 10);

  const maxScore = Number(topByScore[0]?.computed_score) || 1;

  return (
    <div className="analytics-panel">

      <h3 className="analytics-title">Platform Overview</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="ac-label">Avg Commits / Developer</div>
          <div className="ac-value">{avgCommits}</div>
        </div>
        <div className="analytics-card">
          <div className="ac-label">Avg Stars / Developer</div>
          <div className="ac-value">{avgStars}</div>
        </div>
        <div className="analytics-card">
          <div className="ac-label">Total Lines Added</div>
          <div className="ac-value">
            {totalLines >= 1000 ? (totalLines / 1000).toFixed(1) + "K" : totalLines}
          </div>
        </div>
        <div className="analytics-card">
          <div className="ac-label">Avg Match Score</div>
          <div className="ac-value">{avgScore}</div>
        </div>
      </div>

      <h3 className="analytics-title" style={{ marginTop: 28 }}>Language Distribution</h3>
      <div className="lang-dist">
        {languages.slice(0, 10).map((l, i) => {
          const pct = Math.round((l.repo_count / maxRepoCount) * 100);
          return (
            <div className="lang-dist-row" key={l.language_name}>
              <span className="lang-dist-name">{l.language_name}</span>
              <div className="lang-dist-track">
                <div
                  className="lang-dist-fill"
                  style={{ width: pct + "%", background: LANG_COLORS[i % LANG_COLORS.length] }}
                />
              </div>
              <span className="lang-dist-count">{l.repo_count} repos</span>
            </div>
          );
        })}
      </div>

      <h3 className="analytics-title" style={{ marginTop: 28 }}>Top Developer Scores</h3>
      <div className="lang-dist">
        {topByScore.map((d, i) => {
          const pct = Math.round((Number(d.computed_score) / maxScore) * 100);
          return (
            <div className="lang-dist-row" key={d.user_id || i}>
              <span className="lang-dist-name" style={{ color: "var(--accent)" }}>
                {d.username}
              </span>
              <div className="lang-dist-track">
                <div
                  className="lang-dist-fill"
                  style={{ width: pct + "%", background: "var(--accent)" }}
                />
              </div>
              <span className="lang-dist-count">{Number(d.computed_score).toFixed(0)}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}