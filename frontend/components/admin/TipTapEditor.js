import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export default function TipTapEditor({ value, onChange, onUploadImage }) {
  const imageInputRef = useRef(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Начните писать пост...' }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
      }),
    ],
    content: value || EMPTY_DOC,
    editorProps: {
      attributes: {
        class: 'post-editor__content',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    const next = value || EMPTY_DOC;
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  if (!editor) return <div className="post-editor__loading">Инициализация редактора...</div>;

  const setLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Введите адрес ссылки', prev || '');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const addImageFromFile = () => {
    imageInputRef.current?.click();
  };

  const onPickImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!onUploadImage) {
      window.alert('Загрузка файлов не подключена');
      return;
    }
    try {
      const uploaded = await onUploadImage(file);
      if (uploaded?.url) {
        editor.chain().focus().setImage({ src: uploaded.url }).run();
      }
    } catch (err) {
      window.alert(err.message || 'Не удалось загрузить изображение');
    }
  };

  return (
    <div className="post-editor">
      <div className="post-editor__toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Жирный">Ж</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Курсив">К</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Подчёркнутый">Ч</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Зачёркнутый">З</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>Заголовок 1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>Заголовок 2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>Заголовок 3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>Маркированный список</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>Нумерованный список</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>Цитата</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}>Код</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Разделитель">Линия</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} title="По левому краю">Слева</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} title="По центру">По центру</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} title="По правому краю">Справа</button>
        <button type="button" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}>Ссылка</button>
        <button type="button" onClick={addImageFromFile}>Фото</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>Отменить</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>Повторить</button>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={onPickImageFile}
        style={{ display: 'none' }}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
