import { Mark, markPasteRule } from '@tiptap/core'

// Tiptap's Link extension autolinks URLs and emails as you type or paste
// (via linkify); phone numbers aren't a linkify default type, so this adds
// paste-time detection for US-style numbers and wraps them in a tel: link.
// Kept as its own mark (not reusing the Link mark) so it can't collide with
// Link's own paste rules -- renders identically via the shared .xc-link CSS.
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g

export const PhoneLink = Mark.create({
  name: 'phoneLink',
  inclusive: false,

  addAttributes() {
    return {
      href: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-phone-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      { ...HTMLAttributes, 'data-phone-link': '', target: '_blank', rel: 'noopener noreferrer', class: 'xc-link' },
      0,
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: PHONE_PATTERN,
        type: this.type,
        getAttributes: (match) => ({ href: `tel:+1${match[0].replace(/\D/g, '').slice(-10)}` }),
      }),
    ]
  },
})
