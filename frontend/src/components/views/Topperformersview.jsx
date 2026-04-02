import DeveloperGrid from "../DeveloperGrid";

export default function TopPerformersView({ developers, loading }) {
  const top10 = [...developers]
    .sort((a, b) => Number(b.computed_score) - Number(a.computed_score))
    .slice(0, 10);

  return (
    <>
      <div className="view-tabs">
        <div className="tab active">
          <span className="tab-dot" />
          TOP PERFORMERS
          <span className="tab-count">{top10.length}</span>
        </div>
      </div>

      {loading ? <LoadingBars /> : (
        <DeveloperGrid developers={top10} isSearchResult={false} />
      )}
    </>
  );
}

function LoadingBars() {
  return (
    <div className="loading-state">
      <div className="loading-bars">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <p>Loading top performers...</p>
    </div>
  );
}