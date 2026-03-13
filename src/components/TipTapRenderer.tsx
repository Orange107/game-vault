import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { useEffect } from 'react';
import { createLowlight, common } from 'lowlight';

interface TipTapRendererProps {
  content: string;
  plain?: boolean;
}

const lowlight = createLowlight(common);

export const TipTapRenderer = ({ content, plain = false }: TipTapRendererProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    editable: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const contentNode = (
    <EditorContent
      editor={editor}
      className="tiptap-renderer-content"
      style={{
        color: '#fff',
        fontSize: 14,
        lineHeight: 1.6,
      }}
    />
  );

  if (plain) {
    return contentNode;
  }

  return (
    <div
      style={{
        background: '#161d24',
        borderRadius: 6,
        padding: 16,
        minHeight: 100,
      }}
    >
      {contentNode}
    </div>
  );
};

export default TipTapRenderer;
