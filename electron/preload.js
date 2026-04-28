const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('objectiveTracker', {
  onBackgroundThemeSelected(callback) {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('background-theme-selected', (_event, theme) => callback(theme));
  },
});
