import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.use({
  gfm: true,
  breaks: true,
})

export function renderMarkdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false })
  const str = typeof html === 'string' ? html : String(html)
  return DOMPurify.sanitize(str)
}
