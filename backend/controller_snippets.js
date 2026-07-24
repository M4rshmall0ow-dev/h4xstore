const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'controllers');
const files = fs.readdirSync(dir).filter((f)=>f.endsWith('.js')).sort();
const summary = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  summary[file] = [];
  lines.forEach((line, idx) => {
    if (/req\.body|req\.params|req\.query|res\.json|res\.status\(|prisma\.|module\.exports|exports\./.test(line)) {
      summary[file].push({ line: idx+1, text: line.trim() });
    }
  });
}
console.log(JSON.stringify(summary, null, 2));