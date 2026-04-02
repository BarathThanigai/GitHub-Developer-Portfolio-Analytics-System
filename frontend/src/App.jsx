import { useState, useEffect } from "react";
import SearchPanel from "./components/SearchPanel";
import DeveloperGrid from "./components/DeveloperGrid";
import StatsBar from "./components/StatsBar";
import SQLViewer from "./components/SQLViewer";
import Sidebar from "./components/Sidebar";
import AllDevelopersView from "./components/views/Alldevelopersview";
import TopPerformersView from "./components/views/Topperformersview";
import SearchResultsView from "./components/views/Searchresultsview";
import AnalyticsView from "./components/views/Analyticsview";
import TeamsView from "./components/views/Teamsview";
import ExploreView from "./components/views/Exploreview";
import "./App.css";

export default function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [stats, setStats] = useState(null);
  const [sqlInfo, setSqlInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeView, setActiveView] = useState("all"); // 'all' | 'search'
  const [languages, setLanguages]   = useState([]);
  const [filterText, setFilterText] = useState("");

  const API = "http://localhost:3001/api";

  useEffect(() => {
    fetchInitialData();
  }, []);

async function fetchInitialData() {
  setLoading(true);
  try {
    const [devRes, statsRes, langRes] = await Promise.all([
      fetch(`${API}/developers`),
      fetch(`${API}/stats`),
      fetch(`${API}/languages`),
    ]);
    const devData   = await devRes.json();
    const statsData = await statsRes.json();
    const langData  = await langRes.json();
    setAllDevelopers(devData.developers || []);
    setStats(statsData);
    setLanguages(langData.languages || []);
  } catch (e) {
    setError("Cannot connect to backend. Make sure the server is running on port 3001.");
  } finally {
    setLoading(false);
  }
}

  async function handleSearch(query) {
    setSearchLoading(true);
    setError(null);
    setHasSearched(true);
    setActiveView("search");
    try {
      const res = await fetch(`${API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSearchResults(data.results || []);
      setSqlInfo({
        sql: data.generated_sql,
        usedFallback: data.used_fallback,
        queryType: data.query_type,
        ollamaError: data.ollama_error,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSearchLoading(false);
    }
  }

function handleLanguageSearch(langName) {
  handleSearch(`developers who use ${langName}`);
}

  const displayDevs = activeView === "search" ? searchResults : allDevelopers;

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bracket">$</span>
            <span className="logo-text">Dev</span>
            <span className="logo-accent">Match</span>
          </div>
        </div>
      </header>

      <Sidebar
        activeView={activeView}
        onNavSelect={(view) => {
          setActiveView(view);
          setError(null);
          if (view === "all") { setFilterText(""); fetchInitialData(); }
        }}
        onLanguageSearch={handleLanguageSearch}
        developers={allDevelopers}
        languages={languages}
        searchResults={searchResults}
        hasSearched={hasSearched}
        filterText={filterText}
        onFilterChange={(val) => {
          setFilterText(val);
          setActiveView("all");
        }}
      />

      <main className="main">
        <div className="content">
          {stats && <StatsBar stats={stats} />}

          <SearchPanel onSearch={handleSearch} loading={searchLoading} />

          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {sqlInfo && <SQLViewer sqlInfo={sqlInfo} />}

          {activeView === "all"       && <AllDevelopersView developers={allDevelopers} loading={loading} filterText={filterText} />}
          {activeView === "top"       && <TopPerformersView developers={allDevelopers} loading={loading} />}
          {activeView === "search"    && <SearchResultsView searchResults={searchResults} searchLoading={searchLoading} hasSearched={hasSearched} />}
          {activeView === "analytics" && <AnalyticsView developers={allDevelopers} languages={languages} />}
          {activeView === "teams"     && <TeamsView developers={allDevelopers} />}
          {activeView === "explore"   && <ExploreView developers={allDevelopers} />}
        </div>
      </main>

      <footer className="footer">
        <span>DevMatch Analytics System</span>
        <span className="sep">·</span>
        <span>MySQL + Ollama + React</span>
        <span className="sep">·</span>
        <span className="status-dot" />
        <span>AI Query Engine Active</span>
      </footer>
    </div>
  );
}
