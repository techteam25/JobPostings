// noinspection CssUnusedSymbol

"use client";

import { useEffect, useState, ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Eraser,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Enter text...",
  height = "200px",
  className = "",
  readOnly = false,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur,
  });

  // Destroy editor on unmount
  useEffect(() => () => editor?.destroy(), [editor]);

  // Sync external value → internal content (but only when not focused)
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;

    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div
        className="bg-muted animate-pulse rounded-md"
        style={{
          height: typeof height === "number" ? `${height}px` : height,
        }}
      />
    );
  }

  /** Generic toolbar button */
  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "hover:bg-border flex h-9 w-9 items-center justify-center rounded transition-colors",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {children}
    </button>
  );

  const HeadingButton = ({
    level,
    Icon,
    title,
  }: {
    level: 1 | 2 | 3;
    Icon: any;
    title: string;
  }) => (
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
      isActive={editor.isActive("heading", { level })}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </ToolbarButton>
  );

  const AlignButton = ({
    align,
    Icon,
    title,
  }: {
    align: "left" | "center" | "right" | "justify";
    Icon: any;
    title: string;
  }) => (
    <ToolbarButton
      onClick={() => editor.chain().focus().setTextAlign(align).run()}
      isActive={editor.isActive({ textAlign: align })}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </ToolbarButton>
  );

  const handleLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", prev || "https://");
    if (url === null) return;

    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className={cn(className)}>
      {!readOnly && (
        <div className="border-border bg-background flex flex-wrap items-center gap-1 rounded-t-xl border p-2 shadow-sm">
          {/* Paragraph & Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>

          <HeadingButton level={1} Icon={Heading1} title="Heading 1" />
          <HeadingButton level={2} Icon={Heading2} title="Heading 2" />
          <HeadingButton level={3} Icon={Heading3} title="Heading 3" />

          <Separator />

          {/* Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <Separator />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Separator />

          {/* Alignment */}
          <AlignButton align="left" Icon={AlignLeft} title="Align Left" />
          <AlignButton align="center" Icon={AlignCenter} title="Align Center" />
          <AlignButton align="right" Icon={AlignRight} title="Align Right" />
          <AlignButton align="justify" Icon={AlignJustify} title="Justify" />

          <Separator />

          {/* Link */}
          <ToolbarButton
            onClick={handleLink}
            isActive={editor.isActive("link")}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          {/* Clear */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Clear Formatting"
          >
            <Eraser className="text-destructive h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <div className="border-border bg-background rounded-b-xl border shadow-sm">
        <EditorContent editor={editor} className="p-3" />
      </div>

      <GlobalStyles height={height} />
    </div>
  );
}

/** Inline separator */
const Separator = () => <div className="bg-border mx-1 h-6 w-px" />;

/** Global styles for TipTap */
function GlobalStyles({ height }: { height: string | number }) {
  return (
    <style jsx global>{`
      .ProseMirror {
        min-height: ${typeof height === "number" ? `${height}px` : height};
        outline: none;
        font-size: 0.875rem;
      }

      /* Placeholder text */
      .ProseMirror p.is-editor-empty:first-child::before {
        color: hsl(var(--muted-foreground));
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }

      /* Headings */
      .ProseMirror h1 {
        font-size: 1.9rem;
        margin: 0.5em 0;
        font-weight: 700;
      }
      .ProseMirror h2 {
        font-size: 1.45rem;
        margin: 0.5em 0;
        font-weight: 600;
      }
      .ProseMirror h3 {
        font-size: 1.2rem;
        margin: 0.5em 0;
        font-weight: 600;
      }

      /* Lists */
      .ProseMirror ul,
      .ProseMirror ol {
        padding-left: 1.5rem;
        margin: 0.5em 0;
      }

      /* Alignment */
      .ProseMirror [style*="text-align"] {
        display: block;
      }
    `}</style>
  );
}
