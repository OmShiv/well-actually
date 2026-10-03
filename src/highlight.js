// A tiny JavaScript highlighter for the proofs: comments, strings, numbers,
// keywords, and method names. It escapes everything it doesn't wrap.

const KEYWORDS = new Set([
  'const', 'let', 'var', 'for', 'of', 'in', 'if', 'else', 'return', 'new', 'function',
  'true', 'false', 'null', 'undefined', 'typeof', 'while', 'break', 'continue',
]);

const TOKEN = /(\/\/[^\n]*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d[\d_]*(?:\.\d+)?n?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/gs;

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function highlight(code) {
  let out = '';
  let previous = '';
  for (const m of code.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = m;
    if (comment) out += `<span class="tok-comment">${escape(comment)}</span>`;
    else if (string) out += `<span class="tok-string">${escape(string)}</span>`;
    else if (number) out += `<span class="tok-number">${escape(number)}</span>`;
    else if (word && KEYWORDS.has(word)) out += `<span class="tok-keyword">${word}</span>`;
    else if (word && previous === '.') out += `<span class="tok-method">${word}</span>`;
    else out += escape(text);
    if (text.trim()) previous = text;
  }
  return out;
}
