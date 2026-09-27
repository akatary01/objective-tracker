const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let currentThemeIndex = 0;

const BACKGROUND_THEMES = [
  { label: 'Paper', primary: '#f0efe9', secondary: '#e5e5e3', plus: '#3e3e40', fontPrimary: '#1c1c1e', fontSecondary: '#5e5e62' },
  { label: 'Sky', primary: '#d9ecff', secondary: '#c7def5', plus: '#2d5b84', fontPrimary: '#17384f', fontSecondary: '#3c5f79' },
  { label: 'Lemon', primary: '#fff6cc', secondary: '#ebe2b6', plus: '#7d6625', fontPrimary: '#4e4210', fontSecondary: '#786833' },
  { label: 'Mint', primary: '#ddf4e5', secondary: '#c8e1d1', plus: '#2f6a4f', fontPrimary: '#1f4c38', fontSecondary: '#44745f' },
  { label: 'Rose', primary: '#ffe1dc', secondary: '#eccbc6', plus: '#8b4d47', fontPrimary: '#5f3431', fontSecondary: '#8a5854' },
  { label: 'Stone', primary: '#dedede', secondary: '#c9c9c9', plus: '#4b4b4b', fontPrimary: '#2f2f2f', fontSecondary: '#555555' },
];

function applyBackgroundTheme(win, theme) {
  if (!win || win.isDestroyed()) return;
  win.setBackgroundColor(theme.primary);
  win.webContents.send('background-theme-selected', theme);
}

function cycleTheme(win) {
  currentThemeIndex = (currentThemeIndex + 1) % BACKGROUND_THEMES.length;
  const theme = BACKGROUND_THEMES[currentThemeIndex];
  applyBackgroundTheme(win, theme);
  return theme;
}

function createWindow() {
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  const win = new BrowserWindow({
    width: 320,
    height: 600,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 16, y: 14 } : undefined,
    roundedCorners: false,
    resizable: true,
    minWidth: 240,
    minHeight: 300,
    backgroundColor: '#f0efe9',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isMac) {
    win.setWindowButtonVisibility(false);
  }

  Menu.setApplicationMenu(null);
  win.setAutoHideMenuBar(true);
  win.setMenuBarVisibility(false);

  win.loadFile(path.join(__dirname, '../index.html'));

  currentThemeIndex = 0;
  applyBackgroundTheme(win, BACKGROUND_THEMES[currentThemeIndex]);
}

ipcMain.handle('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.minimize();
});

ipcMain.handle('window:toggle-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win || win.isDestroyed()) return;
  win.setFullScreen(!win.isFullScreen());
});

ipcMain.handle('theme:cycle', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win || win.isDestroyed()) return BACKGROUND_THEMES[currentThemeIndex];
  return cycleTheme(win);
});

ipcMain.handle('window:close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
