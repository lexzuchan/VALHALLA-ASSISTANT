const fs = require('node:fs');
const path = require('node:path');
function atomicWrite(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, file);
}
function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      const backup = file + '.corrupt-' + Date.now();
      try {
        fs.copyFileSync(file, backup);
      } catch {}
      console.error('Local data could not be read; preserving original:', path.basename(file));
    }
    return fallback;
  }
}
function validateProject(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid project.');
  const title = String(value.title || 'Untitled workspace').slice(0, 120),
    notes = String(value.notes || '');
  if (notes.length > 100000) throw new Error('Notes are limited to 100,000 characters.');
  if (!Array.isArray(value.messages) || value.messages.length > 200)
    throw new Error(
      'A project can contain at most 200 messages. Export or start a new conversation.',
    );
  const messages = value.messages.map((m) => {
    if (
      !m ||
      !['user', 'assistant'].includes(m.role) ||
      typeof m.text !== 'string' ||
      m.text.length > 40000
    )
      throw new Error('Invalid conversation message.');
    return {
      role: m.role,
      text: m.text,
      created: Number.isFinite(m.created) ? m.created : Date.now(),
    };
  });
  return { title, notes, messages, updated: Date.now() };
}
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 30)
    throw new Error('Send between 1 and 30 recent messages.');
  let length = 0;
  const clean = messages.map((m) => {
    if (
      !m ||
      !['user', 'assistant'].includes(m.role) ||
      typeof m.text !== 'string' ||
      m.text.length > 40000
    )
      throw new Error('Invalid chat message.');
    length += m.text.length;
    return { role: m.role, text: m.text };
  });
  if (length > 120000) throw new Error('Conversation is too large. Start a new conversation.');
  if (clean.at(-1).role !== 'user') throw new Error('Last message must be from the user.');
  return clean;
}
module.exports = { atomicWrite, readJSON, validateProject, validateMessages };
