const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'routes');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const routeInfo = [];
for (const file of files) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, 'utf8');
  const lines = text.split(/\r?\n/);
  const imports = [];
  for (const line of lines) {
    const m = line.match(/const\s+(.+)\s+=\s+require\(['"](.+)['"]\)/);
    if (m) {
      imports.push({ var: m[1].trim(), req: m[2].trim() });
    }
  }
  routeInfo.push({ file, imports });
}
console.log(JSON.stringify(routeInfo, null, 2));