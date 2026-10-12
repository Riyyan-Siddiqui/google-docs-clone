import { useRef, useState } from "react";
import { api, MAX_UPLOAD_BYTES, SUPPORTED_UPLOADS } from "../api";
import type { Doc } from "../types";
import { useToast } from "./Toast";

interface Props {
  onImported: (doc: Doc) => void;
}

/** Imports a .txt / .md / .docx file as a brand-new editable document. */
export default function UploadButton({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!SUPPORTED_UPLOADS.includes(ext as (typeof SUPPORTED_UPLOADS)[number])) {
      toast.show(`Unsupported file type. Use ${SUPPORTED_UPLOADS.join(", ")}.`, "error");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.show("File is too large (max 2 MB).", "error");
      return;
    }

    setBusy(true);
    try {
      const doc = await api.importFile(file);
      toast.show(`Imported “${doc.title}”`, "success");
      onImported(doc);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={`Supported: ${SUPPORTED_UPLOADS.join(", ")} (max 2 MB)`}
      >
        {busy ? "Importing…" : "⬆ Import file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_UPLOADS.join(",")}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
        aria-label="Import a document file"
      />
    </>
  );
}
