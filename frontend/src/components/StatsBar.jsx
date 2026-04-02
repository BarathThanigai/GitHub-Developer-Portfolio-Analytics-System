export default function StatsBar({ stats }) {
  const items = [
    { label: "DEVELOPERS", value: stats.total_users, sub: "indexed profiles" },
    { label: "REPOSITORIES", value: stats.total_repos, sub: "tracked codebases" },
    { label: "COMMITS", value: stats.total_commits?.toLocaleString(), sub: "contributions logged" },
    { label: "LANGUAGES", value: stats.total_languages, sub: "technologies tracked" },
  ];

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <div className="stat-label">{item.label}</div>
          <div className="stat-value">{item.value ?? "–"}</div>
          <div className="stat-sub">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
