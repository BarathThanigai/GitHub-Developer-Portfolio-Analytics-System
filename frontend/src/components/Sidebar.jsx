export default function Sidebar({
  activeView,
  onNavSelect,
  onLanguageSearch,
  developers,
  languages,
  searchResults,
  hasSearched,
  filterText,
  onFilterChange,
}) 

{
  const teamCount = new Set(developers.map(d => d.country).filter(Boolean)).size;

  const navItems = [
    { key: "all",    icon: "📊", label: "All Developers", badge: developers.length },
    { key: "top",    icon: "⭐", label: "Top Performers",  badge: 10 },
    {
      key: "search", icon: "🔍", label: "Search Results",
      badge: hasSearched ? searchResults.length : null,
      disabled: !hasSearched,
    },
  ];

  const insightItems = [
    { key: "analytics", icon: "📈", label: "Analytics" },
    { key: "teams",     icon: "🎯", label: "Teams",   badge: teamCount },
    { key: "explore",   icon: "💼", label: "Explore" },
  ];

  return (
    <aside className="sidebar">

      {/* ── Filter input ── */}
      <div className="sidebar-section">
        <input
          type="text"
          className="sidebar-search"
          placeholder="Find a repository..."
          value={filterText}
          onChange={e => {
            onFilterChange(e.target.value);
          }}
        />
      </div>

      {/* ── Views ── */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">Views</h3>
        <ul className="sidebar-list">
          {navItems.map(item => (
            <li
              key={item.key}
              className={`sidebar-item ${activeView === item.key ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
              onClick={() => !item.disabled && onNavSelect(item.key)}
              title={item.disabled ? "Run a search first" : undefined}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && (
                <span className={`sidebar-badge ${item.key === "search" ? "accent" : ""}`}>
                  {item.badge}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Insights ── */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">Insights</h3>
        <ul className="sidebar-list">
          {insightItems.map(item => (
            <li
              key={item.key}
              className={`sidebar-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => onNavSelect(item.key)}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Top Languages ── */}
      {languages.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">Top Languages</h3>
          <ul className="sidebar-list">
            {languages.slice(0, 6).map(lang => (
              <li
                key={lang.language_name}
                className="sidebar-item"
                onClick={() => onLanguageSearch(lang.language_name)}
                title={`Search ${lang.language_name} developers`}
              >
                <span className="lang-dot-sidebar" />
                <span style={{ flex: 1 }}>{lang.language_name}</span>
                <span className="sidebar-badge">
                  {lang.dev_count ?? lang.repo_count ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </aside>
  );
}