const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  launchGame: (g,l,v)=>ipcRenderer.send('launch-game',g,l,v),
  getSettings: ()=>ipcRenderer.invoke('get-settings'),
  saveSettings: (l,v)=>ipcRenderer.send('save-settings',l,v)
})

