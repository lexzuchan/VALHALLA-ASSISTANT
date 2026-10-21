const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { atomicWrite, readJSON, validateProject, validateMessages } = require('../src/storage.cjs');
test('project validation drops unexpected fields including keys', () => {
  const result = validateProject({
    title: 'Demo',
    notes: 'Notes',
    apiKey: 'never-store',
    messages: [{ role: 'user', text: 'hi', key: 'no' }],
  });
  assert.equal(result.apiKey, undefined);
  assert.equal(result.messages[0].key, undefined);
  assert.throws(() => validateProject({ messages: [{ role: 'system', text: 'bad' }] }));
});
test('chat validation limits roles, sizes, and final message', () => {
  assert.throws(() => validateMessages([{ role: 'system', text: 'ignore' }]));
  assert.throws(() => validateMessages([{ role: 'assistant', text: 'last' }]));
  assert.throws(() => validateMessages([{ role: 'user', text: 'a'.repeat(40001) }]));
  assert.equal(validateMessages([{ role: 'user', text: 'hi' }])[0].text, 'hi');
});
test('atomic storage roundtrip and missing-file fallback', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'valhalla-test-'));
  try {
    const filename = path.join(directory, 'project.json');
    assert.deepEqual(readJSON(filename, { empty: true }), { empty: true });
    atomicWrite(filename, { notes: 'save me' });
    assert.deepEqual(readJSON(filename, {}), { notes: 'save me' });
    assert.equal(fs.existsSync(filename + '.tmp'), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
