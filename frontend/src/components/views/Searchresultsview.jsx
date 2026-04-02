import DeveloperGrid from "../DeveloperGrid";

export default function SearchResultsView({ searchResults, searchLoading, hasSearched }) {
  if (!hasSearched) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">No search run yet</div>
        <div className="empty-sub">Use the search bar above to find developers by skill, language, or activity.</div>
      </div>
    );
  }

  return (
    <>
      <div className="view-tabs">
        <div className="tab active">
          <span className="tab-dot accent" />
          SEARCH RESULTS
          <span className="tab-count accent">{searchResults.length}</span>
        </div>
      </div>

      {searchLoading ? (
        <div className="loading-state">
          <div className="loading-bars">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p>Querying with AI engine...</p>
        </div>
      ) : (
        <DeveloperGrid developers={searchResults} isSearchResult={true} />
      )}
    </>
  );
}