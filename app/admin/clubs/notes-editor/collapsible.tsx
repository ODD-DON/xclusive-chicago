'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { ChevronRight } from 'lucide-react'

// Native <details>/<summary> so expand/collapse and keyboard operation come
// free from the browser -- ProseMirror only needs to mirror the "open" state
// back into the doc when the user toggles it, via this node view.
function DetailsView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper
      as="details"
      open={node.attrs.open}
      onToggle={(e: React.SyntheticEvent<HTMLDetailsElement>) => updateAttributes({ open: e.currentTarget.open })}
      className="my-2 rounded-lg border border-border/50 bg-muted/30 group"
    >
      <NodeViewContent />
    </NodeViewWrapper>
  )
}

export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary detailsContent',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el: HTMLElement) => el.hasAttribute('open'),
        renderHTML: (attrs: { open: boolean }) => (attrs.open ? { open: '' } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'details' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DetailsView)
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              content: [
                { type: 'detailsSummary', content: [{ type: 'text', text: 'Section title' }] },
                { type: 'detailsContent', content: [{ type: 'paragraph' }] },
              ],
            })
            .run(),
    }
  },
})

function SummaryView() {
  return (
    <NodeViewWrapper as="summary" className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none font-medium text-sm marker:content-none [&::-webkit-details-marker]:hidden">
      <span contentEditable={false} className="shrink-0 flex items-center">
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
      </span>
      <NodeViewContent<'span'> as="span" className="flex-1 min-w-0" />
    </NodeViewWrapper>
  )
}

export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SummaryView)
  },
})

export const DetailsContent = Node.create({
  name: 'detailsContent',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-details-content]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-details-content': '', class: 'px-3 pb-3 pt-0' }), 0]
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    details: {
      setDetails: () => ReturnType
    }
  }
}
