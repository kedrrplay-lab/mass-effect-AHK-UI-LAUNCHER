const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ini = require('ini');

let win;

const configPath = path.join(app.getPath('userData'), 'launcher-config.json');


function loadConfig() {
if (fs.existsSync(configPath)) {
return JSON.parse(fs.readFileSync(configPath));
}
return {
gamePath: null,
lang: "Russian",
vo: 0
};
}

function saveConfig(cfg) {
fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}


function autoFindGame() {
const guesses = [
"C:/Program Files (x86)/Mass Effect Legendary Edition/Game",
"C:/Program Files/Mass Effect Legendary Edition/Game",
"D:/Games/Mass Effect Legendary Edition/Game"
];

for (let p of guesses) {
if (fs.existsSync(p)) return p;
}

return null;
}

async function getGamePath() {
let cfg = loadConfig();

if (cfg.gamePath && fs.existsSync(cfg.gamePath)) {
return cfg.gamePath;
}

let auto = autoFindGame();
if (auto) {
cfg.gamePath = auto;
saveConfig(cfg);
return auto;
}

const result = await dialog.showOpenDialog({
title: "Выбери папку Game",
properties: ['openDirectory']
});

if (!result.canceled) {
cfg.gamePath = result.filePaths[0];
saveConfig(cfg);
return cfg.gamePath;
}

return null;
}


function getLangCodes(lang, vo) {
if (lang === "English") {
return {
ME1: "INT",
ME2: "INT",
ME3: "INT"
};
}

if (lang === "Russian") {
return {
ME1: vo ? "RU" : "RA", // 🔥 ключ
ME2: "RUS",
ME3: "RUS"
};
}

return {
ME1: "INT",
ME2: "INT",
ME3: "INT"
};
}


function createWindow() {
win = new BrowserWindow({
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


ipcMain.handle('get-settings', () => {
const cfg = loadConfig();

return {
lang: cfg.lang || "Russian",
vo: cfg.vo || 0
};
});

ipcMain.on('save-settings', (event, lang, vo) => {
let cfg = loadConfig();
cfg.lang = lang;
cfg.vo = vo;
saveConfig(cfg);
});


ipcMain.on('launch-game', async (event, game, lang, vo) => {
let cfg = loadConfig();

cfg.lang = lang;
cfg.vo = vo;
saveConfig(cfg);

const base = await getGamePath();
if (!base) return;

const iniPath = path.join(base, 'MassEffectLauncher.ini');


fs.writeFileSync(iniPath, ini.stringify({
Language: {
Lang: lang,
EnglishVO: vo
}
}));

const exeMap = {
ME1: "ME1/Binaries/Win64/MassEffect1.exe",
ME2: "ME2/Binaries/Win64/MassEffect2.exe",
ME3: "ME3/Binaries/Win64/MassEffect3.exe"
};

const exePath = path.join(base, exeMap[game]);

if (!fs.existsSync(exePath)) {
console.error("EXE not found:", exePath);
return;
}

const codes = getLangCodes(lang, vo);

let args = [
"-NoHomeDir",
"-SeekFreeLoadingPCConsole",
"-Subtitles", "20"
];


if (game === "ME1" || game === "ME2") {
args.push(`-OVERRIDELANGUAGE=${codes[game]}`);
}

if (game === "ME3") {
args.push(`-language=${codes[game]}`);
}

const cmd = `"${exePath}" ${args.join(" ")}`;

console.log("CMD:", cmd);

const child = spawn(cmd, {
cwd: path.dirname(exePath),
shell: true,
detached: true
});

child.unref();

setTimeout(() => app.quit(), 2000);
});
