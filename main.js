const { app, BrowserWindow, ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const basePath = app.isPackaged
  ? path.dirname(process.execPath)
  : __dirname;

const iniPath = path.join(basePath, 'MassEffectLauncher.ini');
const ahkPath = path.join(basePath, 'launcher.exe');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('ui/index.html');
}

app.whenReady().then(createWindow);

// 🔥 ЗАПУСК ИГРЫ
ipcMain.on('launch-game', (event, game, lang, vo) => {
  execFile(ahkPath, [game, lang, vo], (err) => {
    if (err) console.error(err);
  });

  app.quit();
});

// 🔥 СОХРАНЕНИЕ (БЕЗ ЗАПУСКА)
ipcMain.on('save-settings', (event, lang, vo) => {
  execFile(ahkPath, ["save", lang, vo], (err) => {
    if (err) console.error(err);
  });
});

// 🔥 ЧТЕНИЕ INI (из папки лаунчера)
ipcMain.handle('get-settings', () => {
  try {
    if (!fs.existsSync(iniPath)) {
      return { lang: "Russian", vo: false };
    }

    const data = fs.readFileSync(iniPath, 'utf8');

    return {
      lang: data.includes("Lang=English") ? "English" : "Russian",
      vo: data.includes("EnglishVO=1")
    };
  } catch (e) {
    return { lang: "Russian", vo: false };
  }
});