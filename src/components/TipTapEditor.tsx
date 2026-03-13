import { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { createLowlight, common } from 'lowlight';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Code, Undo, Redo } from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const lowlight = createLowlight(common);

const CODE_LANG_OPTIONS = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
];

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  const isCodeBlockActive = editor.isActive('codeBlock');
  const currentCodeLanguage = String(editor.getAttributes('codeBlock').language || 'plaintext');

  const buttonStyle = (isActive: boolean) => ({
    padding: '6px 8px',
    borderRadius: 4,
    border: 'none',
    background: isActive ? '#6ee7b7' : 'transparent',
    color: isActive ? '#12181d' : '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        background: '#161d24',
        borderBottom: '1px solid #2d3741',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={buttonStyle(editor.isActive('bold'))}
        title="粗体"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={buttonStyle(editor.isActive('italic'))}
        title="斜体"
      >
        <Italic size={16} />
      </button>
      <div style={{ width: 1, height: 20, background: '#2d3741', margin: '0 4px' }} />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={buttonStyle(editor.isActive('heading', { level: 2 }))}
        title="标题"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={buttonStyle(editor.isActive('bulletList'))}
        title="无序列表"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={buttonStyle(editor.isActive('orderedList'))}
        title="有序列表"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={buttonStyle(editor.isActive('blockquote'))}
        title="引用"
      >
        <Quote size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock({ language: currentCodeLanguage }).run()}
        style={buttonStyle(editor.isActive('codeBlock'))}
        title="代码块"
      >
        <Code size={16} />
      </button>
      <select
        value={currentCodeLanguage}
        disabled={!isCodeBlockActive}
        onChange={(event) => {
          editor.chain().focus().setCodeBlock({ language: event.target.value }).run();
        }}
        title={isCodeBlockActive ? '代码语言' : '先插入代码块再选择语言'}
        style={{
          height: 28,
          borderRadius: 4,
          border: '1px solid #2d3741',
          background: isCodeBlockActive ? '#111821' : '#1a222d',
          color: isCodeBlockActive ? '#d5deea' : '#64748b',
          padding: '0 6px',
          minWidth: 130,
          outline: 'none',
          cursor: isCodeBlockActive ? 'pointer' : 'not-allowed',
          fontSize: 12,
        }}
      >
        {CODE_LANG_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div style={{ width: 1, height: 20, background: '#2d3741', margin: '0 4px' }} />
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        style={{
          ...buttonStyle(false),
          opacity: editor.can().chain().focus().undo().run() ? 1 : 0.3,
        }}
        title="撤销"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        style={{
          ...buttonStyle(false),
          opacity: editor.can().chain().focus().redo().run() ? 1 : 0.3,
        }}
        title="重做"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export const TipTapEditor = ({ content, onChange, placeholder = '开始输入...' }: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      handleKeyDown(view, event) {
        if (event.key !== 'Tab') return false;

        const isInCodeBlock = view.state.selection.$from.parent.type.name === 'codeBlock';
        if (!isInCodeBlock) return false;

        event.preventDefault();
        view.dispatch(view.state.tr.insertText('    '));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div
      style={{
        border: '1px solid #2d3741',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#161d24',
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        style={{
          minHeight: 200,
          maxHeight: 400,
          overflow: 'auto',
        }}
      />
    </div>
  );
};

export default TipTapEditor;
