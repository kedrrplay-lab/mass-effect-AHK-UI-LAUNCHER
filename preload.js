const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchGame: (game, lang, vo) =>
    ipcRenderer.send('launch-game', game, lang, vo),

  getSettings: () => ipcRenderer.invoke('get-settings')
});