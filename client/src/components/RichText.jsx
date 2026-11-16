import { useEffect, useState } from 'react';

// KaTeX est chargé à la demande, une seule fois, puis gardé en cache par le service worker.
let katexLib = null;
let katexPromise = null;
const loadKatex = () =>
  (katexPromise ||= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => (katexLib = m.default)));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Formules reconnues : \[..\], $$..$$, \(..\), $..$ (sur plusieurs lignes, sans ligne vide),
// et les environnements equation / align / gather / multline / eqnarray.
const ENV = 'equation|align|gather|multline|eqnarray';
const MATH = new RegExp(
  String.raw`(\\begin\{(${ENV})\*?\}[\s\S]*?\\end\{\2\*?\}|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$(?:[^$\\\n]|\\[\s\S]|\n(?![ \t]*\n))+?\$)`,
  'g'
);

function decoder(m) {
  const env = m.match(new RegExp(String.raw`^\\begin\{(${ENV})\*?\}([\s\S]*)\\end\{\1\*?\}$`));
  let display = true;
  let body;
  if (env) {
    const [, nom, b] = env;
    body = nom === 'equation' || nom === 'multline' ? b : nom === 'gather' ? `\\begin{gathered}${b}\\end{gathered}` : `\\begin{aligned}${b}\\end{aligned}`;
  } else if (m.startsWith('\\[') || m.startsWith('$$')) body = m.slice(2, -2);
  else {
    display = false;
    body = m.startsWith('\\(') ? m.slice(2, -2) : m.slice(1, -1);
  }
  // Commandes de document que KaTeX ne connaît pas.
  body = body.replace(/\\(?:label\{[^}]*\}|nonumber|notag)/g, '');
  // Arbre de preuve (fractions imbriquées autour de ⊢) : on garde chaque étage en taille normale.
  if (/\\vdash/.test(body)) body = body.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac');
  return { display, body };
}

/** Texte + LaTeX léger (formules, \section, \textbf, listes, center) -> HTML sûr. */
export function toHtml(src, katex) {
  const maths = [];
  let t = (src || '').replace(/\r\n?/g, '\n').replace(MATH, (m) => `\u0001${maths.push(m) - 1}\u0002`);
  t = esc(t)
    .replace(/\\(?:documentclass|usepackage)(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\(?:begin|end)\{document\}/g, '')
    .replace(/\\(?:vspace|hspace)\*?\{[^}]*\}/g, '')
    .replace(/\\(?:noindent|centering|newpage|clearpage|smallskip|medskip|bigskip|par)\b/g, '')
    .replace(/\\section\*?\{([^}]*)\}/g, '<h3>$1</h3>')
    .replace(/\\(?:subsection|subsubsection|paragraph)\*?\{([^}]*)\}/g, '<h4>$1</h4>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\(?:emph|textit)\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
    .replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>')
    .replace(/\\begin\{enumerate\}(?:\[[^\]]*\])?/g, '<ol>')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\begin\{itemize\}/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\begin\{center\}/g, '<div class="rt-center">')
    .replace(/\\end\{center\}/g, '</div>')
    .replace(/\\item\s*([\s\S]*?)(?=\\item|<\/ol>|<\/ul>|$)/g, '<li>$1</li>')
    .replace(/\\(?:\\|newline\b)/g, '\n')
    .replace(/\\([%_#])/g, '$1')
    .replace(/\\&amp;/g, '&amp;')
    .replace(/\s*(<\/?(?:h3|h4|ol|ul|li|div)(?: class="rt-center")?>)\s*/g, '$1')
    .replace(/\s*\u0001(\d+)\u0002\s*/g, (all, i) => (decoder(maths[i]).display ? `\u0001${i}\u0002` : all))
    // Une ligne vide à l'intérieur d'une liste ou d'un bloc centré ne doit pas couper le bloc.
    .replace(/<(ol|ul)>[\s\S]*<\/\1>|<div class="rt-center">[\s\S]*?<\/div>/g, (bloc) => bloc.replace(/\n{2,}/g, '<br>'));

  t = t
    .split(/\n{2,}/)
    .map((p) => `<div class="rt-p">${p.replace(/\n/g, '<br>')}</div>`)
    .join('');

  return t.replace(/\u0001(\d+)\u0002/g, (_, i) => {
    const m = maths[i];
    if (!katex) return `<code>${esc(m)}</code>`;
    const { display, body } = decoder(m);
    try {
      const html = katex.renderToString(body, { displayMode: display, throwOnError: false, output: 'html' });
      // Une formule en ligne très large (arbre de preuve, grande fraction) défile au lieu de déborder.
      return display ? html : `<span class="rt-inline">${html}</span>`;
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
