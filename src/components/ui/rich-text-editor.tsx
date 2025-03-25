import React, { useEffect, useState } from 'react'
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Code,
  List,
  ListOrdered,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const colors = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#64748b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[100px] w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Set mounted state after initialization
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update content when value changes externally
  useEffect(() => {
    if (editor && isMounted && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value, isMounted])

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full">
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            placement: 'top',
            maxWidth: '100%'
          }}
          className="bg-white border border-gray-200 rounded-md p-1 flex flex-wrap gap-1 max-w-[90vw] md:max-w-sm"
        >
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 p-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 p-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 p-0 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Code"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0"
                title="Text Color"
              >
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" side="top">
              <div className="grid grid-cols-5 gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center"
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      editor.chain().focus().setColor(color.value).run()
                    }}
                    title={color.name}
                  >
                    {color.value === 'inherit' && <span className="text-xs">A</span>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} placeholder={placeholder} />
      <div className="text-xs text-gray-500 mt-1">
        Select text to format it with the popup toolbar.
      </div>
    </div>
  )
} 