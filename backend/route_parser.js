const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'routes');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const routes = [];
for (const file of files) {
  const filepath = path.join(dir, file);
  const text = fs.readFileSync(filepath, 'utf8');
  const lines = text.split(/\r?\n/);
  const route = { file, definitions: [] };
  lines.forEach((line, idx) => {
    const m = line.match(/router\.(get|post|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]\s*,\s*(.+)\)/);
    if (m) {
      const method = m[1];
      const routePath = m[2];
      const handlers = m[3].split(',').map(s => s.trim()).filter(Boolean);
      route.definitions.push({ line: idx+1, method, routePath, handlers });
    }
  });
  routes.push(route);
}
console.log(JSON.stringify(routes, null, 2));
