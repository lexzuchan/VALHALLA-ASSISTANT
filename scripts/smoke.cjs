const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');
let output = '';
const child = spawn(electron, [path.join(__dirname, '..'), '--smoke-test'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  env: { ...process.env, OPENAI_API_KEY: '' },
});
child.stdout.on('data', (data) => {
  output += data;
  process.stdout.write(data);
});
child.stderr.on('data', (data) => process.stderr.write(data));
const timer = setTimeout(() => {
  child.kill();
  console.error('Desktop smoke test timed out.');
  process.exitCode = 1;
}, 35000);
child.on('error', (error) => {
  clearTimeout(timer);
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  clearTimeout(timer);
  if (code !== 0 || !output.includes('VALHALLA_SMOKE_PASS')) {
    console.error('Desktop startup was not verified. Exit: ' + code);
    process.exitCode = 1;
  }
});
