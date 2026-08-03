// Converts every non-ASCII character in worker.js into a \uXXXX (or surrogate-pair) escape,
// producing a pure-ASCII copy that survives any clipboard/editor paste without mojibake.
// JS rebuilds the exact Unicode at runtime. Source stays human-readable; only the paste copy is escaped.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/worker.js', 'utf8');
function hex(n) { return '\\u' + n.toString(16).padStart(4, '0'); }
const out = src.replace(/[^\x00-\x7F]/gu, function (c) {
  const cp = c.codePointAt(0);
  if (cp > 0xFFFF) {
    const v = cp - 0x10000;
    return hex(0xD800 + (v >> 10)) + hex(0xDC00 + (v & 0x3FF));
  }
  return hex(cp);
});
process.stdout.write(out);
