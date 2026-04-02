"use client";

import { type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";

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
  type LucideIcon,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface RichTextEditorProps {
  defaultValue?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onCharacterCount?: (count: number) => void;
  characterLimit?: number;
  placeholder?: string;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  defaultValue = "",
  onChange,
  onBlur,
  onCharacterCount,
  characterLimit,
  placeholder = "Enter text...",
  height = "200px",
  className = "",
  readOnly = false,
}: RichTextEditorProps) {
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
      ...(characterLimit !== undefined
        ? [CharacterCount.configure({ limit: characterLimit })]
        : [CharacterCount]),
    ],
    content: defaultValue,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      if (onCharacterCount) {
        onCharacterCount(editor.storage.characterCount.characters());
      }
    },
    onBlur,
    onCreate: ({ editor }) => {
      if (onCharacterCount) {
        onCharacterCount(editor.storage.characterCount.characters());
      }
    },
  });

  if (!editor) {
    return (
      <Skeleton
        className="rounded-md"
        style={{
          height: typeof height === "number" ? `${height}px` : height,
        }}
      />
    );
  }

  return (
    <div className={cn(className)}>
      {!readOnly && <Toolbar editor={editor} height={height} />}

      <div
        className="border-border rounded-b-xl border bg-transparent shadow-sm"
        style={{
          minHeight: typeof height === "number" ? `${height}px` : height,
        }}
      >
        <EditorContent editor={editor} className="p-3" />
      </div>
    </div>
  );
}

/** Toolbar with formatting controls */
function Toolbar({ editor }: { editor: Editor; height: string | number }) {
  const handleLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", prev || "https://");
    if (url === null) return;

    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        toast.error("Only http and https URLs are allowed.");
        return;
      }
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border-border flex flex-wrap items-center gap-1 rounded-t-xl border bg-transparent p-2 shadow-sm">
      {/* Paragraph & Headings */}
      <ToolbarToggle
        pressed={editor.isActive("paragraph")}
        onToggle={() => editor.chain().focus().setParagraph().run()}
        label="Paragraph"
      >
        <Type />
      </ToolbarToggle>

      <HeadingToggle editor={editor} level={1} Icon={Heading1} />
      <HeadingToggle editor={editor} level={2} Icon={Heading2} />
      <HeadingToggle editor={editor} level={3} Icon={Heading3} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Formatting */}
      <ToolbarToggle
        pressed={editor.isActive("bold")}
        onToggle={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold />
      </ToolbarToggle>

      <ToolbarToggle
        pressed={editor.isActive("italic")}
        onToggle={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic />
      </ToolbarToggle>

      <ToolbarToggle
        pressed={editor.isActive("underline")}
        onToggle={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <UnderlineIcon />
      </ToolbarToggle>

      <ToolbarToggle
        pressed={editor.isActive("strike")}
        onToggle={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <Strikethrough />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarToggle
        pressed={editor.isActive("bulletList")}
        onToggle={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet List"
      >
        <List />
      </ToolbarToggle>

      <ToolbarToggle
        pressed={editor.isActive("orderedList")}
        onToggle={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered List"
      >
        <ListOrdered />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <AlignToggle editor={editor} align="left" Icon={AlignLeft} />
      <AlignToggle editor={editor} align="center" Icon={AlignCenter} />
      <AlignToggle editor={editor} align="right" Icon={AlignRight} />
      <AlignToggle editor={editor} align="justify" Icon={AlignJustify} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      <ToolbarToggle
        pressed={editor.isActive("link")}
        onToggle={handleLink}
        label="Insert Link"
      >
        <LinkIcon />
      </ToolbarToggle>

      {/* Clear */}
      <Toggle
        pressed={false}
        onPressedChange={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        onMouseDown={(e) => e.preventDefault()}
        aria-label="Clear Formatting"
      >
        <Eraser className="text-destructive" />
      </Toggle>
    </div>
  );
}

/** Reusable toolbar toggle that prevents focus loss */
function ToolbarToggle({
  pressed,
  onToggle,
  label,
  children,
}: {
  pressed: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onToggle}
      onMouseDown={(e) => e.preventDefault()}
      aria-label={label}
    >
      {children}
    </Toggle>
  );
}

/** Heading level toggle */
function HeadingToggle({
  editor,
  level,
  Icon,
}: {
  editor: Editor;
  level: 1 | 2 | 3;
  Icon: LucideIcon;
}) {
  return (
    <ToolbarToggle
      pressed={editor.isActive("heading", { level })}
      onToggle={() => editor.chain().focus().toggleHeading({ level }).run()}
      label={`Heading ${level}`}
    >
      <Icon />
    </ToolbarToggle>
  );
}

/** Alignment toggle */
function AlignToggle({
  editor,
  align,
  Icon,
}: {
  editor: Editor;
  align: "left" | "center" | "right" | "justify";
  Icon: LucideIcon;
}) {
  return (
    <ToolbarToggle
      pressed={editor.isActive({ textAlign: align })}
      onToggle={() => editor.chain().focus().setTextAlign(align).run()}
      label={`Align ${align}`}
    >
      <Icon />
    </ToolbarToggle>
  );
}
