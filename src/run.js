// Runs a card's proof and returns what it logged, formatted the way a
// JavaScript console would show it. The same code runs in the browser, where
// players can edit it, and in the test suite, which checks every card.

export function formatValue(value, nested = false) {
  if (typeof value === 'string') return nested ? `'${value}'` : value;
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (value === undefined || value === null || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v, true)).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v, true)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return String(value);
}

export function runProof(code, { timeoutLines = 200 } = {}) {
  const lines = [];
  const log = (...args) => {
    if (lines.length < timeoutLines) lines.push(args.map((a) => formatValue(a)).join(' '));
  };
  const fakeConsole = { log, info: log, warn: log, error: log };
  try {
    new Function('console', `'use strict';\n${code}`)(fakeConsole);
    return { lines, error: null };
  } catch (error) {
    return { lines, error: `${error.name}: ${error.message}` };
  }
}
