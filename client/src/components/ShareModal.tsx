import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import type { Share } from "../types";
import "./ShareModal.css";

interface Props {
  docId: string;
  onClose: () => void;
}

export default function ShareModal({ docId, onClose }: Props) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Share["role"]>("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listShares(docId).then(setShares).catch((e) => setError(e.message));
  }, [docId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError("Enter a valid email address.");
    setError(null);
    setBusy(true);
    try {
      const share = await api.addShare(docId, address, role);
      setShares((prev) => [...(prev ?? []).filter((s) => s.userId !== share.userId), share]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    try {
      await api.removeShare(docId, userId);
      setShares((prev) => prev?.filter((s) => s.userId !== userId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove access");
    }
  }

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="modal__head">
          <h2 id="share-title">Share document</h2>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="share__form" onSubmit={onSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Add people by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <select className="share__role" value={role} onChange={(e) => setRole(e.target.value as Share["role"])} aria-label="Permission">
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
          <button className="btn btn--primary" disabled={busy} type="submit">{busy ? "Sharing…" : "Share"}</button>
        </form>
        {error && <p className="error-text" role="alert">{error}</p>}

        <h3 className="share__sub">People with access</h3>
        {shares === null ? (
          <p className="share__empty">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="share__empty">Only you can see this document.</p>
        ) : (
          <ul className="share__list">
            {shares.map((s) => (
              <li key={s.userId}>
                <span className="share__avatar">{s.name.charAt(0)}</span>
                <span className="share__who"><strong>{s.name}</strong><small>{s.email}</small></span>
                <span className="badge badge--shared">{s.role === "editor" ? "Can edit" : "Can view"}</span>
                <button className="btn btn--ghost btn--danger" onClick={() => remove(s.userId)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
