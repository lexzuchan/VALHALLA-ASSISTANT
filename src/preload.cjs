const { contextBridge, ipcRenderer } = require('electron');
const commands = new Set([
  'bootstrap',
  'settings',
  'localStatus',
  'openSetup',
  'saveProject',
  'exportProject',
  'importFiles',
  'removeFile',
  'chat',
  'cancel',
  'transcribe',
  'microphone',
  'window',
]);
contextBridge.exposeInMainWorld('valhalla', {
  invoke: (command, value) => {
    if (!commands.has(command)) return Promise.reject(new Error('Unknown command.'));
    return ipcRenderer.invoke('valhalla', command, value);
  },
  onStatus: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('status', listener);
    return () => ipcRenderer.removeListener('status', listener);
  },
});
