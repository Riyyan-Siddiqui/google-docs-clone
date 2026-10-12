import type { Editor } from "@tiptap/react";
import "./Toolbar.css";

interface Props {
  editor: Editor | null;
  disabled?: boolean;
}

type BlockValue = "p" | "1" | "2" | "3";

function currentBlock(editor: Editor): BlockValue {
  for (const level of [1, 2, 3] as const) {
    if (editor.isActive("heading", { level })) return String(level) as BlockValue;
  }
  return "p";
}

interface BtnProps {
  label: string;
  title: string;
  off: boolean;
  active?: boolean;
  can?: boolean;
  onClick: () => void;
}

function Btn({ label, title, off, active, can, onClick }: BtnProps) {
  return (
    <button
      type="button"
      className={`toolbar__btn${active ? " is-active" : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={off || can === false}
      // keep the editor selection when clicking toolbar buttons
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function Toolbar({ editor, disabled }: Props) {
  if (!editor) return <div className="toolbar" />;

  const off = disabled || !editor.isEditable;

  function setBlock(value: BlockValue) {
    const chain = editor!.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else chain.setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <Btn off={off} label="↶" title="Undo" can={editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
      <Btn off={off} label="↷" title="Redo" can={editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
      <span className="toolbar__sep" />

      <select
        className="toolbar__select"
        aria-label="Text style"
        value={currentBlock(editor)}
        disabled={off}
        onChange={(e) => setBlock(e.target.value as BlockValue)}
      >
        <option value="p">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
      <span className="toolbar__sep" />

      <Btn off={off} label="B" title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn off={off} label="I" title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <Btn off={off} label="U" title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <span className="toolbar__sep" />

      <Btn off={off} label="• List" title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <Btn off={off} label="1. List" title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
    </div>
  );
}
