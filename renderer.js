let lang = "Russian";
let vo = 0;
let playtime = { ME1: 0, ME2: 0, ME3: 0 };

async function init() {
const settings = await window.electronAPI.getSettings();

lang = settings.lang;
vo = settings.vo;
playtime = settings.playtime;

updateUI();
}

function launch(game) {
window.electronAPI.launchGame(game, lang, vo);
}

function toggleLang() {
lang = (lang === "Russian") ? "English" : "Russian";
window.electronAPI.saveSettings(lang, vo);
updateUI();
}

function toggleVO() {
vo = vo ? 0 : 1;
window.electronAPI.saveSettings(lang, vo);
updateUI();
}

function formatTime(sec) {
const h = Math.floor(sec / 3600);
const m = Math.floor((sec % 3600) / 60);
return `${h}h ${m}m`;
}

function updateUI() {
document.getElementById("langBtn").innerText = lang;
document.getElementById("voBtn").innerText = vo ? "VO ON" : "VO OFF";

document.getElementById("me1Time").innerText = formatTime(playtime.ME1);
document.getElementById("me2Time").innerText = formatTime(playtime.ME2);
document.getElementById("me3Time").innerText = formatTime(playtime.ME3);
}

window.onload = init;
