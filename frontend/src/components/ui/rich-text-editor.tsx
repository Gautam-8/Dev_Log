"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2 } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: { levels: [2] },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-4',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pl-4',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'leading-normal',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert focus:outline-none min-h-[150px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn(
      "relative rounded-md border border-input bg-background ring-offset-background",
      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}>
      <div className="flex items-center gap-1 p-1 border-b bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-7 px-2",
            editor.isActive('bold') && "bg-muted"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-7 px-2",
            editor.isActive('italic') && "bg-muted"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-7 px-2",
            editor.isActive('heading', { level: 2 }) && "bg-muted"
          )}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-7 px-2",
            editor.isActive('bulletList') && "bg-muted"
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-7 px-2",
            editor.isActive('orderedList') && "bg-muted"
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={cn(
            "h-7 px-2",
            editor.isActive('link') && "bg-muted"
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent 
        editor={editor} 
        className={cn(
          "p-3",
          "min-h-[150px]",
          "overflow-y-auto",
          "prose prose-sm dark:prose-invert max-w-none",
          "focus:outline-none",
          "placeholder:text-muted-foreground",
          "[&_p]:m-0 [&_p]:min-h-[1.5em]",
          "[&_p:empty]:before:content-[attr(data-placeholder)]",
          "[&_p:empty]:before:text-muted-foreground",
          "[&_p:empty]:before:opacity-50",
          "[&_p:empty]:before:pointer-events-none",
          "[&_p:empty]:before:select-none",
          "[&_p:empty]:before:absolute",
          "[&_p:empty]:before:top-3",
          "[&_p:empty]:before:left-3",
        )}
      />
    </div>
  )
} 