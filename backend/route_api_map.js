const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const map = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const imports = {};
  lines.forEach(line => {
    const m = line.match(/const\s+(\{[^}]+\}|[\w$]+)\s*=\s*require\(['"](.+)['"]\)/);
    if (m) {
      const vars = m[1].replace(/[{}]/g, '').split(',').map(s => s.trim());
      vars.forEach(v => { imports[v] = m[2]; });
    }
  });
  const defLines = [];
  lines.forEach((line, idx) => {
    const routeMatch = line.match(/router\.(get|post|put|delete|patch|all)\(\s*['"]([^'"]+)['"]\s*,\s*(.+)\)/);
    if (routeMatch) {
      const method = routeMatch[1];
      const routePath = routeMatch[2];
      const handlerText = routeMatch[3];
      defLines.push({ line: idx+1, method, routePath, handlerText });
    }
  });
  map.push({ file, imports, definitions: defLines });
}
console.log(JSON.stringify(map, null, 2));