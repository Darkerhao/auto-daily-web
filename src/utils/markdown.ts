import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  breaks: true,
  linkify: true,
  html: false,
})

export function renderMarkdown(content: string) {
  return markdown.render(content)
}
