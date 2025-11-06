import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
// Table extensions are included in starter-kit
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,

  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onInsertField?: (field: string) => void;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  onInsertField,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      // Table support via StarterKit
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };



  return (
    <div className="glass rounded-lg border border-trading-navy-700">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-trading-navy-700">
        {/* Text Formatting */}
        <div className="flex gap-1 pr-2 border-r border-trading-navy-700">
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('bold') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('italic') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('underline') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('strike') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('code') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 pr-2 border-r border-trading-navy-700">
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('heading', { level: 1 }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('heading', { level: 2 }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('heading', { level: 3 }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 pr-2 border-r border-trading-navy-700">
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('bulletList') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('orderedList') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 pr-2 border-r border-trading-navy-700">
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive({ textAlign: 'left' }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive({ textAlign: 'center' }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive({ textAlign: 'right' }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive({ textAlign: 'justify' }) ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        {/* Other */}
        <div className="flex gap-1 pr-2 border-r border-trading-navy-700">
          <Button
            size="sm"
            variant="ghost"
            className={`glass ${editor.isActive('blockquote') ? 'bg-trading-blue-500/20' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="glass"
            onClick={addLink}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          {/* Table support coming soon */}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="glass"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="glass"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word Count */}
      <div className="flex items-center justify-between p-2 border-t border-trading-navy-700 text-xs text-trading-navy-400">
        <div>
          {editor.storage.characterCount?.characters() || 0} characters
        </div>
        <div>
          {editor.storage.characterCount?.words() || 0} words
        </div>
      </div>
    </div>
  );
}
