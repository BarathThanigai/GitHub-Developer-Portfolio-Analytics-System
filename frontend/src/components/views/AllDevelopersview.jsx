import { useState, useEffect } from "react";
import DeveloperGrid from "../DeveloperGrid";

const API = "http://localhost:3001/api";

export default function AllDevelopersView({ developers, loading, filterText }) {
  const [repoResults, setRepoResults]   = useState([]);
  const [repoLoading, setRepoLoading]   = useState(false);
  const [isFiltering, setIsFiltering]   = useState(false);

  useEffect(() => {
    if (!filterText.trim()) {
      setIsFiltering(false);
      setRepoResults([]);
      return;
    }

    setIsFiltering(true);
    setRepoLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/search/repos?q=${encodeURIComponent(filterText.trim())}`);
        const data = await res.json();
        console.log('Repo search response:', data);  // ← add this
        setRepoResults(data.developers || []);
      } catch {
        setRepoResults([]);
      } finally {
        setRepoLoading(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [filterText]);

  const displayDevs = isFiltering ? repoResults : developers;
  const isLoading   = isFiltering ? repoLoading : loading;

  return (
    <>
      <div className="view-tabs">
        <div className="tab active">
          <span className="tab-dot" />
          {isFiltering ? `REPOS MATCHING "${filterText}"` : "ALL DEVELOPERS"}
          <span className="tab-count">{displayDevs.length}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-bars">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p>{isFiltering ? `Searching repositories for "${filterText}"...` : "Fetching developer analytics..."}</p>
        </div>
      ) : (
        <DeveloperGrid developers={displayDevs} isSearchResult={isFiltering} />
      )}
    </>
  );
}