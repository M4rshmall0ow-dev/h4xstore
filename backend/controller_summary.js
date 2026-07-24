const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'controllers');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const summary = [];
for (const file of files) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, 'utf8');
  const lines = text.split(/\r?\n/);
  const exports = [];
  lines.forEach((line, idx) => {
    const m = line.match(/exports\.([A-Za-z0-9_]+)\s*=\s*(async\s*)?\(?/);
    if (m) {
      exports.push({ name: m[1], line: idx + 1, code: line.trim() });
    }
  });
  summary.push({ file, exports, lines: lines.length });
}
console.log(JSON.stringify(summary, null, 2));