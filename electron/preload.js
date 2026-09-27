const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('objectiveTracker', {
  onBackgroundThemeSelected(callback) {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('background-theme-selected', (_event, theme) => callback(theme));
  },
  minimizeWindow() {
    return ipcRenderer.invoke('window:minimize');
  },
  toggleFullScreen() {
    return ipcRenderer.invoke('window:toggle-fullscreen');
  },
  cycleTheme() {
    return ipcRenderer.invoke('theme:cycle');
  },
  closeWindow() {
    return ipcRenderer.invoke('window:close');
  },
});
