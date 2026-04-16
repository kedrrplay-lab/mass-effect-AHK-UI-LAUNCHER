let lang = "Russian";
let vo = 0;

async function init() {
  const settings = await window.electronAPI.getSettings();
  lang = settings.lang;
  vo = settings.vo ? 1 : 0;
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


function updateUI() {
  document.getElementById("langBtn").innerText = lang.toUpperCase();
  document.getElementById("voBtn").innerText =
    vo ? "ENGLISH VO: ON" : "ENGLISH VO: OFF";
}

window.onload = init;