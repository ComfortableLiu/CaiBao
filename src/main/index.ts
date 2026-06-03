import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { StorageService } from './storage/storage-service';
import { SettingsService } from './storage/settings-service';
import { registerIpcHandlers } from './ipc/handlers';
import { ObjectStorageService } from './services/object-storage-service';

const APP_TITLE = '菜包';

/** 未打包即开发运行（比 NODE_ENV 更可靠，避免 rspack watch 未注入环境变量） */
function isDevMode(): boolean {
  return !app.isPackaged || process.env.NODE_ENV === 'development';
}

function openDevTools(win: BrowserWindow): void {
  if (!isDevMode()) return;
  if (win.webContents.isDevToolsOpened()) return;
  win.webContents.openDevTools({ mode: 'detach' });
}

const storage = new StorageService();
const settings = new SettingsService();
const objectStorage = new ObjectStorageService(settings);

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

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[renderer] did-fail-load', errorCode, errorDescription, validatedURL);
  });

  if (isDevMode()) {
    win.webContents.once('did-finish-load', () => openDevTools(win));
    await win.loadURL('http://localhost:5173');
  } else {
    const indexHtml = path.join(__dirname, '../renderer/index.html');
    await win.loadFile(indexHtml);
  }

  win.setTitle(APP_TITLE);
}

app.setName(APP_TITLE);

app.whenReady().then(async () => {
  await storage.init();
  registerIpcHandlers(storage, settings, objectStorage);
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
