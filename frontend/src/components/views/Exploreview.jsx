import { useState } from "react";
import DeveloperGrid from "../DeveloperGrid";

const SORT_OPTIONS = [
  { value: "stars",    label: "Most Stars" },
  { value: "commits",  label: "Most Commits" },
  { value: "score",    label: "Highest Score" },
  { value: "prs",      label: "Most PRs" },
  { value: "followers",label: "Most Followers" },
];

const SORT_KEY = {
  stars:     "total_stars",
  commits:   "total_commits",
  score:     "computed_score",
  prs:       "total_prs",
  followers: "followers_count",
};

export default function ExploreView({ developers }) {
  const [sortBy, setSortBy] = useState("stars");

  const sorted = [...developers].sort(
    (a, b) => Number(b[SORT_KEY[sortBy]] || 0) - Number(a[SORT_KEY[sortBy]] || 0)
  );

  return (
    <>
      <div className="view-tabs" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex" }}>
          <div className="tab active">
            <span className="tab-dot" />
            EXPLORE
            <span className="tab-count">{sorted.length}</span>
          </div>
        </div>

        <div className="explore-sort">
          <span className="explore-sort-label">Sort by</span>
          <select
            className="explore-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <DeveloperGrid developers={sorted} isSearchResult={false} />
    </>
  );
}