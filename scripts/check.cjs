const fs = require('node:fs'),
  path = require('node:path'),
  { spawnSync } = require('node:child_process');
for (const dir of ['src', 'ui', 'scripts']) {
  for (const file of fs.readdirSync(path.join(__dirname, '..', dir))) {
    if (!/\.(cjs|js)$/.test(file)) continue;
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '..', dir, file)], {
      stdio: 'inherit',
    });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
console.log('All JavaScript syntax checks passed.');
