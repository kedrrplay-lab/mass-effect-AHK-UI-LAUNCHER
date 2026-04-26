const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (lang, vo) => ipcRenderer.send('save-settings', lang, vo),
  launchGame: (game, lang, vo) => ipcRenderer.send('launch-game', game, lang, vo),
  selectGamePath: (game) => ipcRenderer.invoke('select-game-path', game),
  getGamePaths: () => ipcRenderer.invoke('get-game-paths'),
  minimize: () => ipcRenderer.send('window-minimize')
})