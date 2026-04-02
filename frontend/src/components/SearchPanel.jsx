import { useState } from "react";

const QUICK_QUERIES = [
  "frontend developers",
  "AI/ML engineers",
  "backend specialists",
  "DevOps experts",
  "most active contributors",
  "Python developers",
  "mobile developers",
  "full stack React developers",
];

export default function SearchPanel({ onSearch, loading }) {
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  function handleChip(chip) {
    setQuery(chip);
    onSearch(chip);
  }

  return (
    <div className="search-panel">
      <div className="search-label">
        AI NATURAL LANGUAGE QUERY ENGINE
      </div>
      <form className="search-row" onSubmit={handleSubmit}>
        <div className="search-input-wrap">
          <span className="search-prompt">›</span>
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Find senior React developers" or "Top AI/ML contributors"'
            disabled={loading}
          />
        </div>
        <button className="search-btn" type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <>
              <span className="spinner" />
              QUERYING
            </>
          ) : (
            <>⌁ ANALYZE</>
          )}
        </button>
      </form>
      <div className="search-chips">
        {QUICK_QUERIES.map((chip) => (
          <button
            key={chip}
            className="chip"
            onClick={() => handleChip(chip)}
            type="button"
            disabled={loading}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
