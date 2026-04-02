import { useState } from "react";
import UserDetailModal from "../UserDetailModal";

export default function TeamsView({ developers }) {
  const [selectedUserId, setSelectedUserId] = useState(null);

  const teamsByCountry = developers.reduce((acc, dev) => {
    const key = dev.country || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(dev);
    return acc;
  }, {});

  const sorted = Object.entries(teamsByCountry)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <div className="view-tabs">
        <div className="tab active">
          <span className="tab-dot" />
          TEAMS BY COUNTRY
          <span className="tab-count">{sorted.length}</span>
        </div>
      </div>

      <div className="teams-panel">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">No team data available</div>
            <div className="empty-sub">Developer country data is needed to group into teams.</div>
          </div>
        ) : (
          sorted.map(([country, devs]) => (
            <div key={country} className="team-group">
              <div className="team-header">
                <span className="team-country">{country}</span>
                <span className="team-count">
                  {devs.length} developer{devs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="team-members">
                {devs.map(d => (
                  <span
                    key={d.user_id}
                    className="team-member-chip"
                    onClick={() => setSelectedUserId(d.user_id)}
                    title={`View ${d.username}'s profile`}
                  >
                    {d.username}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
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