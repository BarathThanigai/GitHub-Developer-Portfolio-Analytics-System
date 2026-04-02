import { useState, useEffect, useCallback } from "react";
import "./AdminPage.css";

const API = "http://localhost:3002/api/admin";

const TABLES = {
  users: {
    label: "Users",
    icon: "👤",
    endpoint: "users",
    pk: "user_id",
    columns: [
      { key: "user_id",         label: "User ID",       type: "number",   required: true,  readonly: false },
      { key: "username",        label: "Username",      type: "text",     required: true  },
      { key: "email",           label: "Email",         type: "text",     required: true  },
      { key: "state",           label: "State",         type: "text",     required: false },
      { key: "country",         label: "Country",       type: "text",     required: false },
      { key: "followers_count", label: "Followers",     type: "number",   required: false },
    ],
    editReadonly: ["user_id"],
  },

  repositories: {
    label: "Repositories",
    icon: "📁",
    endpoint: "repositories",
    pk: "repo_id",
    columns: [
      { key: "repo_id",        label: "Repo ID",       type: "number",   required: true,  readonly: false },
      { key: "repo_name",      label: "Repo Name",     type: "text",     required: true  },
      { key: "visibility",     label: "Visibility",    type: "select",   required: true,  options: ["public","private"] },
      { key: "user_id",        label: "Owner User ID", type: "number",   required: true  },
      { key: "owner_name",     label: "Owner Name",    type: "text",     required: false, readonly: true },
      { key: "parent_repo_id", label: "Fork of Repo ID", type: "number", required: false },
      { key: "created_at",     label: "Created At",    type: "text",     required: false, readonly: true },
    ],
    editReadonly: ["repo_id", "owner_name", "created_at"],
  },

  commits: {
    label: "Commits",
    icon: "📝",
    endpoint: "commits",
    pk: "commit_id",
    columns: [
      { key: "commit_id",      label: "Commit ID",     type: "text",     required: true  },
      { key: "commit_message", label: "Message",       type: "text",     required: true  },
      { key: "commit_time",    label: "Commit Time",   type: "datetime-local", required: true },
      { key: "lines_added",    label: "Lines Added",   type: "number",   required: false },
      { key: "lines_deleted",  label: "Lines Deleted", type: "number",   required: false },
      { key: "repo_id",        label: "Repo ID",       type: "number",   required: true  },
      { key: "repo_name",      label: "Repo Name",     type: "text",     required: false, readonly: true },
      { key: "user_id",        label: "User ID",       type: "number",   required: true  },
      { key: "username",       label: "Username",      type: "text",     required: false, readonly: true },
    ],
    editReadonly: ["commit_id", "repo_name", "username"],
  },

  languages: {
    label: "Languages",
    icon: "💻",
    endpoint: "languages",
    pk: "language_id",
    columns: [
      { key: "language_id",   label: "Language ID",   type: "number",   required: true  },
      { key: "language_name", label: "Language Name", type: "text",     required: true  },
    ],
    editReadonly: ["language_id"],
  },

  repoLanguages: {
    label: "Repo Languages",
    icon: "🔗",
    endpoint: "repo-languages",
    pk: ["repo_id", "language_id"],
    compositePk: true,
    columns: [
      { key: "repo_id",          label: "Repo ID",         type: "number",  required: true },
      { key: "repo_name",        label: "Repo Name",       type: "text",    required: false, readonly: true },
      { key: "language_id",      label: "Language ID",     type: "number",  required: true },
      { key: "language_name",    label: "Language Name",   type: "text",    required: false, readonly: true },
      { key: "usage_percentage", label: "Usage % (0-100)", type: "number",  required: true },
    ],
    editReadonly: ["repo_id", "language_id", "repo_name", "language_name"],
  },

  pullRequests: {
    label: "Pull Requests",
    icon: "🔀",
    endpoint: "pull-requests",
    pk: "pr_id",
    columns: [
      { key: "pr_id",      label: "PR ID",         type: "number",         required: true  },
      { key: "repo_id",    label: "Repo ID",        type: "number",         required: true  },
      { key: "repo_name",  label: "Repo Name",      type: "text",           required: false, readonly: true },
      { key: "user_id",    label: "User ID",        type: "number",         required: true  },
      { key: "username",   label: "Username",       type: "text",           required: false, readonly: true },
      { key: "status",     label: "Status",         type: "select",         required: false, options: ["open","closed","merged"] },
      { key: "created_at", label: "Created At",     type: "datetime-local", required: false },
      { key: "merged_at",  label: "Merged At",      type: "datetime-local", required: false },
      { key: "closed_at",  label: "Closed At",      type: "datetime-local", required: false },
    ],
    editReadonly: ["pr_id", "repo_name", "username"],
  },

  issues: {
    label: "Issues",
    icon: "⚠️",
    endpoint: "issues",
    pk: "issue_id",
    columns: [
      { key: "issue_id",   label: "Issue ID",   type: "number",   required: true  },
      { key: "repo_id",    label: "Repo ID",    type: "number",   required: true  },
      { key: "repo_name",  label: "Repo Name",  type: "text",     required: false, readonly: true },
      { key: "user_id",    label: "User ID",    type: "number",   required: true  },
      { key: "username",   label: "Username",   type: "text",     required: false, readonly: true },
      { key: "title",      label: "Title",      type: "text",     required: true  },
      { key: "status",     label: "Status",     type: "select",   required: false, options: ["open","closed"] },
      { key: "created_at", label: "Created At", type: "datetime-local", required: false },
    ],
    editReadonly: ["issue_id", "repo_name", "username"],
  },

  repoStats: {
    label: "Repo Stats",
    icon: "📊",
    endpoint: "repo-stats",
    pk: "repo_id",
    columns: [
      { key: "repo_id",      label: "Repo ID",       type: "number",  required: true  },
      { key: "repo_name",    label: "Repo Name",     type: "text",    required: false, readonly: true },
      { key: "stars_count",  label: "Stars Count",   type: "number",  required: false },
      { key: "forks_count",  label: "Forks Count",   type: "number",  required: false },
      { key: "recorded_date",label: "Recorded Date", type: "text",    required: false, readonly: true },
    ],
    editReadonly: ["repo_id", "repo_name", "recorded_date"],
  },

  collaborators: {
    label: "Collaborators",
    icon: "🤝",
    endpoint: "collaborators",
    pk: ["user_id","repo_id"],
    compositePk: true,
    columns: [
      { key: "user_id",       label: "User ID",       type: "number",  required: true },
      { key: "username",      label: "Username",      type: "text",    required: false, readonly: true },
      { key: "repo_id",       label: "Repo ID",       type: "number",  required: true },
      { key: "repo_name",     label: "Repo Name",     type: "text",    required: false, readonly: true },
      { key: "lines_added",   label: "Lines Added",   type: "number",  required: false },
      { key: "lines_deleted", label: "Lines Deleted", type: "number",  required: false },
    ],
    editReadonly: ["user_id", "repo_id", "username", "repo_name"],
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function getPk(table, row) {
  if (table.compositePk) return table.pk.map(k => row[k]).join("/");
  return row[table.pk];
}

function getDeleteUrl(endpoint, row, table) {
  if (table.compositePk) return `${API}/${endpoint}/${table.pk.map(k => row[k]).join("/")}`;
  return `${API}/${endpoint}/${row[table.pk]}`;
}

function emptyForm(columns) {
  return columns.reduce((acc, col) => {
    acc[col.key] = col.type === "select" ? col.options[0] : "";
    return acc;
  }, {});
}

function fmt(val) {
  if (val === null || val === undefined) return <span style={{ color: "#484f58" }}>—</span>;
  if (typeof val === "string" && val.length > 10) {
    try {
      const d = new Date(val);
      if (!isNaN(d) && val.includes("-")) return d.toLocaleDateString();
    } catch { /* ignore */ }
  }
  return String(val);
}

function validate(columns, form, isEdit, editReadonly) {
  const errors = [];
  for (const col of columns) {
    if (isEdit && editReadonly?.includes(col.key)) continue;
    if (col.required && (form[col.key] === "" || form[col.key] === null || form[col.key] === undefined)) {
      errors.push(`${col.label} is required`);
    }
  }
  return errors;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="adm-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">{title}</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Row Form ──────────────────────────────────────────────────────────────────
function RowForm({ table, initial, onSave, onCancel, saving, isEdit }) {
  const [form, setForm]       = useState(initial || emptyForm(table.columns));
  const [errors, setErrors]   = useState([]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleSave() {
    const errs = validate(table.columns, form, isEdit, table.editReadonly);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    onSave(form);
  }

  return (
    <div className="adm-form">
      {errors.length > 0 && (
        <div className="adm-form-errors">
          {errors.map((e, i) => <div key={i} className="adm-form-error">⚠ {e}</div>)}
        </div>
      )}

      {table.columns.map(col => {
        const isReadonly = col.readonly || (isEdit && table.editReadonly?.includes(col.key));
        return (
          <div className="adm-field" key={col.key}>
            <label className="adm-label">
              {col.label}
              {col.required && !isReadonly && <span className="adm-required"> *</span>}
              {isReadonly && <span className="adm-readonly-tag">read-only</span>}
            </label>

            {isReadonly ? (
              <input
                className="adm-input adm-input-readonly"
                type="text"
                value={form[col.key] || ""}
                readOnly
                tabIndex={-1}
              />
            ) : col.type === "select" ? (
              <select
                className="adm-input"
                value={form[col.key] || col.options[0]}
                onChange={e => set(col.key, e.target.value)}
              >
                {col.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className={`adm-input ${col.required ? "adm-input-required" : ""}`}
                type={col.type === "number" ? "number" : col.type === "datetime-local" ? "datetime-local" : "text"}
                value={form[col.key] || ""}
                onChange={e => set(col.key, e.target.value)}
                placeholder={col.required ? `${col.label} (required)` : col.label}
              />
            )}
          </div>
        );
      })}

      <div className="adm-form-actions">
        <button className="adm-btn adm-btn-ghost"   onClick={onCancel}  disabled={saving}>Cancel</button>
        <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────
function TableView({ tableKey }) {
  const table = TABLES[tableKey];
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modal, setModal]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/${table.endpoint}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [table.endpoint]);

  useEffect(() => { load(); }, [load]);

  const visibleCols = table.columns.filter(c => !c.readonly).slice(0, 5);

  const filtered = search.trim()
    ? rows.filter(r =>
        table.columns.some(c =>
          String(r[c.key] ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  async function handleSave(form) {
    setSaving(true);
    try {
      const isEdit = modal !== "add";
      const url    = isEdit ? getDeleteUrl(table.endpoint, modal, table) : `${API}/${table.endpoint}`;
      const res    = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      showToast(isEdit ? "Record updated successfully" : "Record created successfully");
      setModal(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    try {
      const url  = getDeleteUrl(table.endpoint, row, table);
      const res  = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      showToast("Record deleted");
      setDelConfirm(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  return (
    <div className="adm-table-view">

      {toast && <div className={`adm-toast adm-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="adm-toolbar">
        <input
          className="adm-search"
          placeholder={`Search ${table.label.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="adm-toolbar-right">
          <span className="adm-row-count">{filtered.length} records</span>
          <button className="adm-btn adm-btn-primary" onClick={() => setModal("add")}>
            + Add {table.label.replace(/s$/, "")}
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
        {loading ? (
          <div className="adm-loading">
            <div className="adm-spinner" />
            Loading {table.label}...
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                {visibleCols.map(c => (
                  <th key={c.key}>
                    {c.label}
                    {c.required && <span className="adm-th-required"> *</span>}
                  </th>
                ))}
                <th className="adm-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="adm-empty-row">
                    No records found
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={getPk(table, row) || i}>
                  {visibleCols.map(c => (
                    <td key={c.key}>
                      {c.key === "status" || c.key === "visibility"
                        ? <span className={`adm-status adm-status-${row[c.key]}`}>{row[c.key]}</span>
                        : fmt(row[c.key])
                      }
                    </td>
                  ))}
                  <td className="adm-actions-col">
                    <button className="adm-action-btn adm-edit"   onClick={() => setModal(row)} title="Edit">✎</button>
                    <button className="adm-action-btn adm-delete" onClick={() => setDelConfirm(row)} title="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "add"
            ? `Add ${table.label.replace(/s$/, "")}`
            : `Edit ${table.label.replace(/s$/, "")}`
          }
          onClose={() => setModal(null)}
        >
          <RowForm
            table={table}
            initial={modal !== "add" ? { ...modal } : null}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
            isEdit={modal !== "add"}
          />
        </Modal>
      )}

      {delConfirm && (
        <Modal title="Confirm Delete" onClose={() => setDelConfirm(null)}>
          <div className="adm-confirm">
            <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="adm-confirm-actions">
              <button className="adm-btn adm-btn-ghost"  onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={() => handleDelete(delConfirm)}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTable, setActiveTable] = useState("users");

  return (
    <div className="adm-page">

      <div className="adm-header">
        <div className="adm-header-left">
          <div className="adm-logo">
            <span className="adm-logo-bracket">[</span>
            <span className="adm-logo-text">DEV</span>
            <span className="adm-logo-accent">MATCH</span>
            <span className="adm-logo-bracket">]</span>
          </div>
          <div className="adm-header-divider" />
          <div className="adm-header-title">
            <span className="adm-header-icon">⚙</span>
            Admin Panel
          </div>
          <span className="adm-header-sub">Database Management Console</span>
        </div>
        <div className="adm-header-right">
          <span className="adm-live-dot" />
          <span className="adm-live-label">Connected to DB</span>
        </div>
      </div>

      <div className="adm-body">

        <nav className="adm-nav">
          <div className="adm-nav-section-label">Tables</div>
          {Object.entries(TABLES).map(([key, t]) => (
            <button
              key={key}
              className={`adm-nav-item ${activeTable === key ? "active" : ""}`}
              onClick={() => setActiveTable(key)}
            >
              <span className="adm-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="adm-nav-section-label" style={{ marginTop: 24 }}>Links</div>
          <a className="adm-nav-item" href="http://localhost:5173" target="_blank" rel="noreferrer">
            <span className="adm-nav-icon">🚀</span>
            Open Main App
          </a>
        </nav>

        <div className="adm-content">
          <div className="adm-content-header">
            <span className="adm-content-icon">{TABLES[activeTable].icon}</span>
            <h2 className="adm-content-title">{TABLES[activeTable].label}</h2>
            <span className="adm-content-sub">
              {TABLES[activeTable].columns.filter(c => c.required).length} required fields
            </span>
          </div>
          <TableView key={activeTable} tableKey={activeTable} />
        </div>

      </div>
    </div>
  );
}