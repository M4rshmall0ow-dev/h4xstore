const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'controllers');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
const output = [];
for (const file of files) {
  const full = path.join(dir, file);
  try {
    const mod = require(full);
    output.push({ file, exports: Object.keys(mod).sort() });
  } catch (err) {
    output.push({ file, error: err.message });
  }
}
console.log(JSON.stringify(output, null, 2));
