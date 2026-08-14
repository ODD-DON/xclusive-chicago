import { Extension } from '@tiptap/core'

const MAX_INDENT = 6
const STEP_REM = 1.5

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

// Paragraph/heading-level indent (distinct from list nesting, which uses
// sinkListItem/liftListItem instead). Stored as an attribute rather than a
// wrapping node so it round-trips as plain inline style on save/reload.
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el: HTMLElement) => {
              const match = el.style.marginLeft?.match(/^([\d.]+)rem$/)
              return match ? Math.round(parseFloat(match[1]) / STEP_REM) : 0
            },
            renderHTML: (attrs: Record<string, any>) =>
              attrs.indent > 0 ? { style: `margin-left: ${attrs.indent * STEP_REM}rem` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    const step = (delta: 1 | -1) =>
      ({ editor, tr, state, dispatch }: any) => {
        // Inside a list item, indent means nest/un-nest instead.
        if (editor.isActive('listItem')) {
          return delta > 0 ? editor.commands.sinkListItem('listItem') : editor.commands.liftListItem('listItem')
        }
        const { from, to } = state.selection
        let changed = false
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const current = node.attrs.indent || 0
            const next = Math.min(MAX_INDENT, Math.max(0, current + delta))
            if (next !== current) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
              changed = true
            }
          }
        })
        if (changed && dispatch) dispatch(tr)
        return changed
      }
    return {
      indent: () => step(1),
      outdent: () => step(-1),
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  },
})
