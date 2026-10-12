import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, SUPPORTED_UPLOADS } from "../api";
import AppHeader from "../components/AppHeader";
import UploadButton from "../components/UploadButton";
import { useToast } from "../components/Toast";
import type { DocSummary } from "../types";
import "./DashboardPage.css";

type Tab = "all" | "owned" | "shared";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owned", label: "Owned by me" },
  { id: "shared", label: "Shared with me" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDocs(await api.listDocs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    if (!docs) return [];
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) => (tab === "owned" ? d.role === "owner" : tab === "shared" ? d.role !== "owner" : true))
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [docs, tab, query]);

  const counts = useMemo(() => {
    const owned = docs?.filter((d) => d.role === "owner").length ?? 0;
    return { all: docs?.length ?? 0, owned, shared: (docs?.length ?? 0) - owned };
  }, [docs]);

  async function createDoc() {
    setCreating(true);
    try {
      const doc = await api.createDoc();
      navigate(`/docs/${doc.id}`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not create document", "error");
      setCreating(false);
    }
  }

  async function deleteDoc(doc: DocSummary) {
    if (!window.confirm(`Delete “${doc.title}”? This can't be undone.`)) return;
    try {
      await api.deleteDoc(doc.id);
      setDocs((prev) => prev?.filter((d) => d.id !== doc.id) ?? null);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Delete failed", "error");
    }
  }

  return (
    <div className="dash">
      <AppHeader />
      <main className="dash__main">
        <div className="dash__top">
          <div>
            <h1>Documents</h1>
            <p className="dash__hint">Import supports {SUPPORTED_UPLOADS.join(", ")} files up to 2 MB.</p>
          </div>
          <div className="dash__actions">
            <UploadButton onImported={(d) => navigate(`/docs/${d.id}`)} />
            <button className="btn btn--primary" onClick={createDoc} disabled={creating}>
              {creating ? "Creating…" : "+ New document"}
            </button>
          </div>
        </div>

        <div className="dash__toolbar">
          <div className="dash__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`dash__tab${tab === t.id ? " is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label} <span className="dash__count">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <input
            className="input dash__search"
            type="search"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search documents"
          />
        </div>

        {error && (
          <div className="dash__state">
            <p className="error-text">{error}</p>
            <button className="btn" onClick={load}>Retry</button>
          </div>
        )}

        {!error && docs === null && (
          <ul className="dash__grid" aria-busy="true">
            {[0, 1, 2].map((i) => <li key={i} className="doc-card doc-card--skeleton" />)}
          </ul>
        )}

        {!error && docs !== null && visible.length === 0 && (
          <div className="dash__state">
            <p>
              {query
                ? "No documents match your search."
                : tab === "shared"
                  ? "Nothing has been shared with you yet."
                  : "No documents yet. Create one or import a file to get started."}
            </p>
          </div>
        )}

        {!error && visible.length > 0 && (
          <ul className="dash__grid">
            {visible.map((d) => {
              const owned = d.role === "owner";
              return (
                <li key={d.id} className="doc-card">
                  <Link to={`/docs/${d.id}`} className="doc-card__link">
                    <div className="doc-card__preview" aria-hidden>📄</div>
                    <div className="doc-card__body">
                      <h2 className="doc-card__title">{d.title || "Untitled document"}</h2>
                      <p className="doc-card__meta">
                        {owned ? "You" : d.ownerName} · Edited {formatDate(d.updatedAt)}
                      </p>
                      <span className={`badge${owned ? "" : " badge--shared"}`}>
                        {owned ? "Owner" : d.role === "editor" ? "Shared · can edit" : "Shared · view only"}
                      </span>
                    </div>
                  </Link>
                  {owned && (
                    <button
                      className="btn btn--ghost btn--danger doc-card__delete"
                      onClick={() => deleteDoc(d)}
                      aria-label={`Delete ${d.title}`}
                    >
                      Delete
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
