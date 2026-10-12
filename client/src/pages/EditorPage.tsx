import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { api, ApiError } from "../api";
import AppHeader from "../components/AppHeader";
import ShareModal from "../components/ShareModal";
import Toolbar from "../components/Toolbar";
import { useToast } from "../components/Toast";
import type { Doc } from "../types";
import "./EditorPage.css";

type SaveState = "saved" | "dirty" | "saving" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "All changes saved",
  dirty: "Unsaved changes…",
  saving: "Saving…",
  error: "Save failed — retrying on next edit",
};

const AUTOSAVE_MS = 800;

export default function EditorPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [sharing, setSharing] = useState(false);

  const canEdit = doc ? doc.role !== "viewer" : false;
  const isOwner = doc?.role === "owner";

  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<string>("");

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    setSaveState("saving");
    try {
      await api.updateDoc(id, { content: latest.current });
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      toast.show(e instanceof Error ? e.message : "Save failed", "error");
    }
  }, [id, toast]);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline],
    content: "",
    editable: false,
    editorProps: { attributes: { class: "page__content", "aria-label": "Document body" } },
    onUpdate: ({ editor: ed }) => {
      latest.current = ed.getHTML();
      setSaveState("dirty");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), AUTOSAVE_MS);
    },
  });

  // Load the document.
  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setLoadError(null);
    api.getDoc(id)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setTitle(d.title);
        latest.current = d.content;
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(
          e instanceof ApiError && (e.status === 403 || e.status === 404)
            ? "This document doesn't exist or you don't have access."
            : e.message,
        );
      });
    return () => { cancelled = true; };
  }, [id]);

  // Push content + permissions into the editor once the document arrives.
  useEffect(() => {
    if (!editor || !doc) return;
    editor.commands.setContent(doc.content);
    editor.setEditable(doc.role !== "viewer", false); // false: don't emit an update (would mark the doc dirty)
  }, [editor, doc]);

  // Flush pending edits when leaving the page or closing the tab.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function commitTitle() {
    const next = title.trim() || "Untitled document";
    setTitle(next);
    if (!doc || next === doc.title || !canEdit) return;
    try {
      const updated = await api.updateDoc(id, { title: next });
      setDoc((prev) => (prev ? { ...prev, title: updated.title } : prev));
    } catch (e) {
      setTitle(doc.title);
      toast.show(e instanceof Error ? e.message : "Rename failed", "error");
    }
  }

  async function goBack() {
    if (saveState === "dirty") await flush();
    navigate("/");
  }

  if (loadError) {
    return (
      <div>
        <AppHeader />
        <div className="page-center">
          <div style={{ textAlign: "center" }}>
            <p>{loadError}</p>
            <button className="btn" onClick={() => navigate("/")}>Back to documents</button>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div>
        <AppHeader />
        <div className="page-center">Loading document…</div>
      </div>
    );
  }

  return (
    <div className="editor">
      <AppHeader>
        <button className="btn btn--ghost" onClick={goBack} aria-label="Back to documents">←</button>
        <input
          className="editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          maxLength={120}
          readOnly={!canEdit}
          aria-label="Document title"
        />
        <span className={`editor__status editor__status--${saveState}`}>
          {canEdit ? SAVE_LABEL[saveState] : "View only"}
        </span>
        {!isOwner && <span className="badge badge--shared">Shared by {doc.ownerName}</span>}
        {isOwner && <button className="btn btn--primary" onClick={() => setSharing(true)}>Share</button>}
      </AppHeader>

      <Toolbar editor={editor} disabled={!canEdit} />

      <main className="editor__canvas">
        <article className="page">
          <EditorContent editor={editor} />
        </article>
      </main>

      {sharing && <ShareModal docId={id} onClose={() => setSharing(false)} />}
    </div>
  );
}
