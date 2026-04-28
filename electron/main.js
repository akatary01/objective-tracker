const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

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

function createWindow() {
  const win = new BrowserWindow({
    width: 320,
    height: 600,
    titleBarStyle: 'customButtonsOnHover',
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

  win.loadFile(path.join(__dirname, '../index.html'));

  // Minimal menu
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'App',
      submenu: [
        { role: 'hide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Color',
      submenu: BACKGROUND_THEMES.map((theme, index) => ({
        label: `■ ${theme.label}`,
        type: 'radio',
        checked: index === 0,
        click: () => applyBackgroundTheme(win, theme),
      })),
    },
  ]));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
