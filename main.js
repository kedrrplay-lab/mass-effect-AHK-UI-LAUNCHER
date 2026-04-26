const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron')
const { spawn, exec } = require('child_process')
const path = require('path')
const fs = require('fs')

app.commandLine.appendSwitch('disable-renderer-backgrounding')

let win
let tray = null

const configPath = path.join(app.getPath('userData'), 'launcher-config.json')

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8').trim()
      if (!raw) throw new Error()
      const cfg = JSON.parse(raw)
      if (!cfg.playtime) cfg.playtime = { ME1: 0, ME2: 0, ME3: 0 }
      if (!cfg.paths) cfg.paths = { ME1: null, ME2: null, ME3: null }
      return cfg
    }
  } catch {}
  return {
    paths: { ME1: null, ME2: null, ME3: null },
    lang: "Russian",
    vo: 0,
    playtime: { ME1: 0, ME2: 0, ME3: 0 }
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
}

function getLangCodes(lang, vo) {
  switch (lang) {
    case "English": return { ME1: "INT", ME2: "INT", ME3: "INT" }
    case "French": return { ME1: vo ? "FE" : "FR", ME2: vo ? "FRE" : "FRA", ME3: vo ? "FRE" : "FRA" }
    case "German": return { ME1: vo ? "GE" : "DE", ME2: vo ? "DEE" : "DEU", ME3: vo ? "DEE" : "DEU" }
    case "Spanish": return { ME1: "ES", ME2: "ESN", ME3: "ESN" }
    case "Italian": return { ME1: vo ? "IE" : "IT", ME2: vo ? "ITE" : "ITA", ME3: vo ? "ITE" : "ITA" }
    case "Russian": return { ME1: vo ? "RU" : "RA", ME2: "RUS", ME3: "RUS" }
    case "Polish": return { ME1: vo ? "PL" : "PLPC", ME2: vo ? "POE" : "POL", ME3: "POL" }
    case "Japanese": return { ME1: "JA", ME2: "JPN", ME3: "JPN" }
    default: return { ME1: "INT", ME2: "INT", ME3: "INT" }
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  win.loadFile('ui/index.html')
  win.once('ready-to-show', () => win.show())
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png')
    if (!fs.existsSync(iconPath)) return
    tray = new Tray(iconPath)
    const menu = Menu.buildFromTemplate([
      { label: "Открыть", click: () => win.show() },
      { label: "Выход", click: () => app.quit() }
    ])
    tray.setContextMenu(menu)
    tray.on("double-click", () => win.show())
  } catch {}
}

app.whenReady().then(() => {
  if (!fs.existsSync(configPath)) saveConfig(loadConfig())
  createWindow()
  setTimeout(() => {
    createTray()
    startWatcher()
  }, 1200)
})

ipcMain.handle('get-settings', () => loadConfig())

ipcMain.on('save-settings', (e, lang, vo) => {
  let cfg = loadConfig()
  cfg.lang = lang
  cfg.vo = vo
  saveConfig(cfg)
})

ipcMain.handle('select-game-path', async (e, game) => {
  const exeNames = {
    ME1: 'MassEffect1.exe',
    ME2: 'MassEffect2.exe',
    ME3: 'MassEffect3.exe'
  }

  const result = await dialog.showOpenDialog(win, {
    title: 'Выберите ' + exeNames[game],
    filters: [
      { name: exeNames[game], extensions: ['exe'] },
      { name: 'Все файлы', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled) return null

  const selectedFile = result.filePaths[0]
  const fileName = path.basename(selectedFile)

  if (fileName.toLowerCase() !== exeNames[game].toLowerCase()) {
    dialog.showErrorBox('Неверный файл', 'Ожидался ' + exeNames[game] + ', а выбран ' + fileName)
    return null
  }

  let cfg = loadConfig()
  cfg.paths[game] = selectedFile
  saveConfig(cfg)
  return cfg.paths[game]
})

ipcMain.handle('get-game-paths', () => loadConfig().paths)

ipcMain.on('launch-game', (e, game, lang, vo) => {
  let cfg = loadConfig()
  cfg.lang = lang
  cfg.vo = vo
  saveConfig(cfg)

  if (!cfg.paths) cfg.paths = { ME1: null, ME2: null, ME3: null }

  let exePath = cfg.paths[game]

  if (!exePath || !fs.existsSync(exePath)) {
    dialog.showErrorBox('Файл не найден', 'Путь к ' + game + ' не задан или файл не найден.\nУкажите путь к exe через кнопку внизу лаунчера.')
    return
  }

  const codes = getLangCodes(lang, vo)
  let args = ["-NoHomeDir", "-SeekFreeLoadingPCConsole", "-Subtitles", "20"]

  if (game === "ME3") args.push("-language=" + codes[game])
  else args.push("-OVERRIDELANGUAGE=" + codes[game])

  spawn('"' + exePath + '" ' + args.join(" "), {
    cwd: path.dirname(exePath),
    shell: true
  })

  win.hide()
})

ipcMain.on('window-minimize', () => {
  if (win) win.minimize()
})

const processes = {
  ME1: "MassEffect1.exe",
  ME2: "MassEffect2.exe",
  ME3: "MassEffect3.exe"
}

let active = {}

function startWatcher() {
  setTimeout(() => {
    setInterval(() => {
      exec("tasklist", (e, out) => {
        if (e) return
        for (let g in processes) {
          let running = out.includes(processes[g])
          if (running && !active[g]) active[g] = Date.now()
          if (!running && active[g]) {
            let played = Math.floor((Date.now() - active[g]) / 1000)
            let cfg = loadConfig()
            if (!cfg.playtime) cfg.playtime = { ME1: 0, ME2: 0, ME3: 0 }
            if (!cfg.playtime[g]) cfg.playtime[g] = 0
            cfg.playtime[g] += played
            saveConfig(cfg)
            delete active[g]
            if (win) {
              win.show()
              win.focus()
            }
          }
        }
      })
    }, 5000)
  }, 2000)
}