const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'controllers');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const details = [];
for (const file of files) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, 'utf8');
  const fnMatches = [...text.matchAll(/function\s+([\w$]+)\s*\(/g)].map(m => m[1]);
  const constMatches = [...text.matchAll(/const\s+([\w$]+)\s*=\s*async\s*\(/g)].map(m => m[1]);
  const exportMatches = [...text.matchAll(/module\.exports\s*=\s*\{([\s\S]*?)\}/g)];
  const exportNames = exportMatches.length ? exportMatches[0][1].split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean) : [];
  details.push({ file, functions: [...new Set([...fnMatches, ...constMatches])].sort(), exports: exportNames });
}
console.log(JSON.stringify(details, null, 2));