const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
app.setName('VALHALLA');
const { chat, checkLocal, validateModel } = require('./ai.cjs');
const { atomicWrite, readJSON, validateProject, validateMessages } = require('./storage.cjs');
let win,
  settings = {},
  inflight = null,
  localInfo = { ready: false, error: 'Not checked yet.' };
const files = new Map(),
  smoke = process.argv.includes('--smoke-test');
const uiPath = path.join(__dirname, '../ui/index.html'),
  uiURL = pathToFileURL(uiPath).href;
const defaults = { localModel: 'valhalla-local', speak: false };
const filePath = (name) => path.join(app.getPath('userData'), name);
const publicSettings = () => ({
  local: true,
  model: settings.localModel,
  speak: !!settings.speak,
  localStatus: localInfo,
  hasKey: false,
});
function saveSettings(value) {
  const next = { ...settings };
  if (value.model !== undefined) {
    validateModel(value.model);
    if (next.localModel !== value.model)
      localInfo = { ready: false, error: 'Model changed. Check the connection.' };
    next.localModel = value.model;
  }
  if (value.speak !== undefined) next.speak = value.speak === true;
  settings = next;
  atomicWrite(filePath('settings.json'), settings);
  return publicSettings();
}
function status(message) {
  if (win && !win.isDestroyed()) win.webContents.send('status', message);
}
async function controlled(operation) {
  if (inflight) throw new Error('Another AI request is running. Cancel it first.');
  const controller = new AbortController();
  inflight = controller;
  try {
    return await operation(controller.signal);
  } finally {
    if (inflight === controller) inflight = null;
    status('');
  }
}
async function importFiles() {
  const result = await dialog.showOpenDialog(win, {
    title: 'Attach local text references — no cloud upload',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Engineering references',
        extensions: ['txt', 'md', 'csv', 'json'],
      },
    ],
  });
  if (result.canceled) return [];
  if (result.filePaths.length + files.size > 3)
    throw new Error('Attach up to three files at a time.');
  const incoming = [];
  let total = [...files.values()].reduce((sum, f) => sum + f.bytes, 0);
  for (const filename of result.filePaths) {
    const stats = await fs.promises.stat(filename);
    if (!stats.isFile() || stats.size > 10 * 1024 * 1024)
      throw new Error('Each attachment must be a regular file smaller than 10 MB.');
    total += stats.size;
    if (total > 20 * 1024 * 1024) throw new Error('Attachments must total less than 20 MB.');
    const ext = path.extname(filename).toLowerCase();
    if (!['.txt', '.md', '.csv', '.json'].includes(ext))
      throw new Error('The compact local model accepts text files only.');
    const mime = 'text/plain';
    const buffer = await fs.promises.readFile(filename);
    if (mime === 'text/plain' && buffer.length > 100000)
      throw new Error('Text files must be smaller than 100 KB.');
    incoming.push({
      id: crypto.randomUUID(),
      name: path.basename(filename),
      mime,
      data: buffer.toString('base64'),
      bytes: buffer.length,
    });
  }
  for (const f of incoming) files.set(f.id, f);
  return incoming.map(({ id, name, bytes }) => ({ id, name, bytes }));
}
async function handle(command, value) {
  switch (command) {
    case 'bootstrap':
      return {
        settings: publicSettings(),
        project: readJSON(filePath('project.json'), {
          title: 'Untitled engineering workspace',
          notes: '',
          messages: [],
        }),
        version: app.getVersion(),
      };
    case 'settings':
      return saveSettings(value || {});
    case 'localStatus':
      try {
        localInfo = await checkLocal({ model: settings.localModel });
      } catch (error) {
        localInfo = { ready: false, model: settings.localModel, error: error.message };
      }
      return localInfo;
    case 'openSetup': {
      const setupPath = app.isPackaged
        ? path.join(process.resourcesPath, 'local-setup', 'Setup-Local-AI.cmd')
        : path.join(__dirname, '../Setup-Local-AI.cmd');
      shell.showItemInFolder(setupPath);
      return true;
    }
    case 'saveProject': {
      const project = validateProject(value);
      atomicWrite(filePath('project.json'), project);
      return { saved: project.updated };
    }
    case 'exportProject': {
      const project = validateProject(value);
      const result = await dialog.showSaveDialog(win, {
        title: 'Export project',
        defaultPath: 'VALHALLA-project.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (result.canceled) return { cancelled: true };
      const text =
        '# ' +
        project.title +
        '\n\n## Project notes\n\n' +
        project.notes +
        '\n\n## Conversation\n\n' +
        project.messages.map((m) => '### ' + m.role + '\n\n' + m.text).join('\n\n');
      await fs.promises.writeFile(result.filePath, text, 'utf8');
      return { saved: true };
    }
    case 'importFiles':
      return importFiles();
    case 'removeFile':
      files.delete(String(value));
      return true;
    case 'cancel':
      inflight?.abort();
      return true;
    case 'chat': {
      const messages = validateMessages(value?.messages);
      const ids = value?.attachmentIds || [];
      if (!Array.isArray(ids) || ids.length > 3) throw new Error('Invalid attachment list.');
      if (ids.length && value.filesConsent !== true)
        throw new Error('Consent to include references in local chat is required.');
      const attachments = ids.map((id) => {
        const f = files.get(id);
        if (!f) throw new Error('Attachment expired. Please attach it again.');
        return f;
      });
      const notes = value.includeNotes === true ? String(value.notes || '') : '';
      if (notes.length > 100000) throw new Error('Project notes are too large.');
      return controlled(async (signal) => {
        const result = await chat({
          model: settings.localModel,
          messages,
          attachments,
          notes,
          signal,
          onStatus: status,
        });
        localInfo = { ready: true, model: result.model };
        return result;
      });
    }
    case 'microphone':
    case 'transcribe':
      throw new Error(
        'Voice dictation is unavailable in this local-only edition. No audio is recorded or uploaded.',
      );
    case 'window':
      if (value === 'minimize') win.minimize();
      else if (value === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
      else if (value === 'close') win.close();
      return true;
    default:
      throw new Error('Unknown app command.');
  }
}
const userDataDirectory = smoke
  ? path.join(require('node:os').tmpdir(), 'valhalla-smoke-' + process.pid)
  : path.join(app.getPath('appData'), 'VALHALLA');
fs.mkdirSync(userDataDirectory, { recursive: true });
app.setPath('userData', userDataDirectory);
app.whenReady().then(() => {
  settings = { ...defaults, ...readJSON(filePath('settings.json'), {}) };
  try {
    validateModel(settings.localModel);
  } catch {
    settings.localModel = defaults.localModel;
  }
  win = new BrowserWindow({
    width: 1500,
    height: 970,
    minWidth: 1000,
    minHeight: 700,
    title: 'V.A.L.H.A.L.L.A',
    frame: false,
    backgroundColor: '#070d12',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setDevicePermissionHandler(() => false);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.webContents.on('will-attach-webview', (event) => event.preventDefault());
  ipcMain.handle('valhalla', async (event, command, value) => {
    if (
      event.sender !== win?.webContents ||
      event.senderFrame !== win.webContents.mainFrame ||
      event.senderFrame.url !== uiURL
    )
      throw new Error('Untrusted caller.');
    try {
      return await handle(command, value);
    } catch (error) {
      throw new Error(String(error.message || 'App operation failed.').slice(0, 1000));
    }
  });
  win.on('closed', () => {
    inflight?.abort();
    files.clear();
    win = null;
  });
  win.loadFile(uiPath);
  if (smoke) {
    setTimeout(() => {
      console.error('Smoke test timed out.');
      app.exit(1);
    }, 25000).unref();
    win.webContents.once('did-finish-load', async () => {
      try {
        const result = await win.webContents.executeJavaScript(
          `window.valhalla.invoke('bootstrap').then(s=>({key:s.settings.hasKey, title:s.project.title, physics:Physics.calculate('force',{mass:2,acceleration:3}).values[0].value, bridge:typeof window.valhalla.invoke}))`,
        );
        if (result.physics !== 6 || result.bridge !== 'function' || !result.title)
          throw new Error('Startup checks failed.');
        await new Promise((resolve) => setTimeout(resolve, 700));
        fs.mkdirSync(path.join(__dirname, '../release'), { recursive: true });
        fs.writeFileSync(
          path.join(__dirname, '../release/VALHALLA-preview.png'),
          (await win.webContents.capturePage()).toPNG(),
        );
        console.log('VALHALLA_SMOKE_PASS');
        app.exit(0);
      } catch (error) {
        console.error(error.message);
        app.exit(1);
      }
    });
  }
});
app.on('window-all-closed', () => app.quit());
