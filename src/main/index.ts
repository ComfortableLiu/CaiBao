import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { StorageService } from './storage/storage-service';
import { SettingsService } from './storage/settings-service';
import { registerIpcHandlers } from './ipc/handlers';

const APP_TITLE = '菜包';

const isDev = process.env.NODE_ENV === 'development';
const storage = new StorageService();
const settings = new SettingsService();

function bindWindowTitle(win: BrowserWindow): void {
  win.setTitle(APP_TITLE);
  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win.setTitle(APP_TITLE);
  });
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_TITLE,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  bindWindowTitle(win);

  if (isDev) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.setTitle(APP_TITLE);
}

app.setName(APP_TITLE);

app.whenReady().then(async () => {
  await storage.init();
  registerIpcHandlers(storage, settings);
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
