// Minimal, dependency-free Markdown -> HTML for org info pages.
// Supports: # ## ### headings, **bold**, *italic*, [text](url), - / * bullet lists,
// 1. numbered lists, --- horizontal rule, and paragraphs. Output is escaped first,
// so author content cannot inject markup.
function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function inline(s: string) {
  let t = esc(s)
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-teal-700 underline underline-offset-2 hover:text-teal-900">$1</a>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return t
}
export function mdToHtml(src: string): string {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  let para: string[] = []
  const flushPara = () => {
    if (para.length) { out.push(`<p class="text-slate-600 leading-relaxed mb-4">${inline(para.join(' '))}</p>`); para = [] }
  }
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (t === '') { flushPara(); i++; continue }
    if (/^---+$/.test(t)) { flushPara(); out.push('<hr class="my-8 border-slate-200" />'); i++; continue }
    const h = t.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flushPara()
      const lvl = h[1].length
      const cls = lvl === 1 ? 'text-2xl font-extrabold tracking-tight text-slate-900 mt-8 mb-3'
        : lvl === 2 ? 'text-xl font-bold text-slate-900 mt-7 mb-2'
        : 'text-lg font-semibold text-slate-900 mt-6 mb-2'
      out.push(`<h${lvl + 1} class="${cls}">${inline(h[2])}</h${lvl + 1}>`)
      i++; continue
    }
    if (/^[-*]\s+/.test(t)) {
      flushPara(); const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(`<li class="mb-1">${inline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`); i++ }
      out.push(`<ul class="list-disc pl-6 mb-4 text-slate-600 leading-relaxed">${items.join('')}</ul>`); continue
    }
    if (/^\d+\.\s+/.test(t)) {
      flushPara(); const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(`<li class="mb-1">${inline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`); i++ }
      out.push(`<ol class="list-decimal pl-6 mb-4 text-slate-600 leading-relaxed">${items.join('')}</ol>`); continue
    }
    para.push(t); i++
  }
  flushPara()
  return out.join('\n')
}
