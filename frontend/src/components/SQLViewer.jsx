import { useState } from "react";

function highlightSQL(sql) {
  if (!sql) return "";
  const keywords = ["SELECT", "FROM", "WHERE", "JOIN", "LEFT", "INNER", "ON", "GROUP BY", "ORDER BY",
    "HAVING", "LIMIT", "AS", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "DISTINCT", "COUNT",
    "SUM", "AVG", "MAX", "MIN", "ROUND", "COALESCE", "CASE", "WHEN", "THEN", "ELSE", "END",
    "BY", "DESC", "ASC", "WITH", "NULL", "IS", "UNION"];

  let result = sql;

  // Strings
  result = result.replace(/'([^']*)'/g, '<span class="sql-str">\'$1\'</span>');
  // Numbers
  result = result.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="sql-num">$1</span>');
  // Keywords
  keywords.forEach(kw => {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    result = result.replace(re, `<span class="sql-kw">${kw}</span>`);
  });
  // Functions with parens
  result = result.replace(/\b(COUNT|SUM|AVG|MAX|MIN|ROUND|COALESCE|GROUP_CONCAT)\s*\(/gi,
    '<span class="sql-fn">$1</span>(');

  return result;
}

export default function SQLViewer({ sqlInfo }) {
  const [expanded, setExpanded] = useState(true);
  if (!sqlInfo) return null;

  return (
    <div className="sql-viewer">
      <div className="sql-header" onClick={() => setExpanded(!expanded)}>
        <div className="sql-title">
          ⌁ GENERATED SQL QUERY
          <span className={`sql-badge ${sqlInfo.usedFallback ? "fallback" : ""}`}>
            {sqlInfo.usedFallback ? "RULE-BASED" : "AI-GENERATED"}
          </span>
          {sqlInfo.usedFallback && sqlInfo.ollamaError && (
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
              (Ollama unavailable — using smart fallback)
            </span>
          )}
        </div>
        <span className="sql-toggle">{expanded ? "▲ hide" : "▼ show"}</span>
      </div>
      {expanded && (
        <pre
          className="sql-code"
          dangerouslySetInnerHTML={{ __html: highlightSQL(sqlInfo.sql) }}
        />
      )}
    </div>
  );
}
