import { useEffect, useState } from 'react';

// KaTeX est chargé à la demande, une seule fois, puis gardé en cache par le service worker.
let katexLib = null;
let katexPromise = null;
const loadKatex = () =>
  (katexPromise ||= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => (katexLib = m.default)));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MATH = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g;
const isDisplay = (m) => m.startsWith('\\[') || m.startsWith('$$');

/** Texte + LaTeX léger (formules, \section, \textbf, listes) -> HTML sûr. */
export function toHtml(src, katex) {
  const maths = [];
  let t = (src || '').replace(MATH, (m) => `\u0001${maths.push(m) - 1}\u0002`);
  t = esc(t)
    .replace(/\\(?:documentclass|usepackage)(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\(?:begin|end)\{document\}/g, '')
    .replace(/\\section\*?\{([^}]*)\}/g, '<h3>$1</h3>')
    .replace(/\\subsection\*?\{([^}]*)\}/g, '<h4>$1</h4>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\(?:emph|textit)\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\begin\{enumerate\}/g, '<ol>')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\begin\{itemize\}/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\item\s*([\s\S]*?)(?=\\item|<\/ol>|<\/ul>|$)/g, '<li>$1</li>')
    .replace(/\\\\/g, '\n')
    .replace(/\s*(<\/?(?:h3|h4|ol|ul|li)>)\s*/g, '$1')
    .replace(/\s*\u0001(\d+)\u0002\s*/g, (all, i) => (isDisplay(maths[i]) ? `\u0001${i}\u0002` : all));

  t = t
    .split(/\n{2,}/)
    .map((p) => `<div class="rt-p">${p.replace(/\n/g, '<br>')}</div>`)
    .join('');

  return t.replace(/\u0001(\d+)\u0002/g, (_, i) => {
    const m = maths[i];
    const display = isDisplay(m);
    const body = m.startsWith('$') && !m.startsWith('$$') ? m.slice(1, -1) : m.slice(2, -2);
    if (!katex) return `<code>${esc(m)}</code>`;
    try {
      return katex.renderToString(body, { displayMode: display, throwOnError: false, output: 'html' });
    } catch {
      return `<code>${esc(m)}</code>`;
    }
  });
}

export default function RichText({ text, className = '' }) {
  const [katex, setKatex] = useState(() => katexLib);
  const needs = /[$\\]/.test(text || '');
  useEffect(() => {
    if (!needs || katex) return;
    let on = true;
    loadKatex().then((k) => on && setKatex(() => k)).catch(() => {});
    return () => {
      on = false;
    };
  }, [needs, katex]);
  return <div className={`rt ${className}`} dangerouslySetInnerHTML={{ __html: toHtml(text, katex) }} />;
}
