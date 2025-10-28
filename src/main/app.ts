import { app, BrowserWindow, protocol, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { registerIpcHandlers } from './ipc';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'clipforge-media',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const isDev =
  process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL !== undefined;

if (started) {
  app.quit();
}

app.disableHardwareAcceleration();

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    title: 'ClipForge',
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#111827',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (isDev) {
      try {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      } catch (error) {
        console.warn('Failed to open DevTools', error);
      }
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event) => {
    if (event.url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      void shell.openExternal(event.url);
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL).catch((error) => {
      console.error('Failed to load dev server URL', error);
    });
  } else {
    mainWindow
      .loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
      .catch((error) => {
        console.error('Failed to load renderer bundle', error);
      });
  }

  return mainWindow;
};

const bootstrap = async () => {
  await app.whenReady();

  app.setAppUserModelId('com.clipforge.desktop');
  try {
    protocol.registerFileProtocol('clipforge-media', (request, callback) => {
      try {
        const url = new URL(request.url);
        const encodedPath = url.searchParams.get('path');
        if (!encodedPath) {
          callback({ error: -6 });
          return;
        }

        const decodedPath = decodeURIComponent(encodedPath);
        callback({ path: decodedPath });
      } catch (error) {
        console.error('Failed to resolve clipforge-media protocol', error);
        callback({ error: -6 });
      }
    });
  } catch (error) {
    console.warn('clipforge-media protocol registration skipped:', error);
  }
  registerIpcHandlers();

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

bootstrap().catch((error) => {
  console.error('Failed to bootstrap main process', error);
  app.quit();
});
