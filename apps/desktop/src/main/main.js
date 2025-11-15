const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const Store = require('electron-store');
const path = require('path');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// App configuration store
const store = new Store({
  defaults: {
    windowBounds: {
      width: 1280,
      height: 720
    },
    windowState: {
      isMaximized: false,
      isFullScreen: false
    }
  }
});

class KhalistraApp {
  constructor() {
    this.mainWindow = null;
    this.isDev = process.env.NODE_ENV === 'development';
    this.port = process.env.PORT || '3000';
    
    this.setupEventHandlers();
    this.setupSecurityFeatures();
  }

  setupEventHandlers() {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupAutoUpdater();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.saveWindowState();
    });
  }

  setupSecurityFeatures() {
    // Set app security
    app.on('web-contents-created', (_, contents) => {
      // Prevent new window creation
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });

      // Prevent navigation to external URLs
      contents.on('will-navigate', (event, url) => {
        if (!url.startsWith(`http://localhost:${this.port}`) && !url.startsWith('file://')) {
          event.preventDefault();
        }
      });
    });
  }

  createMainWindow() {
    const windowBounds = store.get('windowBounds');
    const windowState = store.get('windowState');

    this.mainWindow = new BrowserWindow({
      width: windowBounds.width,
      height: windowBounds.height,
      minWidth: 1024,
      minHeight: 576,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload/preload.js'),
        webSecurity: !this.isDev
      },
      icon: this.getAppIcon(),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: process.platform !== 'win32', // Remove frame on Windows for custom title bar
      titleBarOverlay: process.platform === 'win32' ? {
        color: '#1a1a1a',
        symbolColor: '#ffffff',
        height: 32
      } : undefined
    });

    // Load the Next.js application
    const startUrl = this.isDev 
      ? `http://localhost:${this.port}` 
      : `file://${path.join(__dirname, '../../frontend/index.html')}`;

    this.mainWindow.loadURL(startUrl);

    // Handle window ready
    this.mainWindow.once('ready-to-show', () => {
      if (!this.mainWindow) return;

      this.mainWindow.show();

      if (windowState.isMaximized) {
        this.mainWindow.maximize();
      }

      if (windowState.isFullScreen) {
        this.mainWindow.setFullScreen(true);
      }

      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window events
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('resize', () => {
      this.saveWindowBounds();
    });

    this.mainWindow.on('move', () => {
      this.saveWindowBounds();
    });

    this.setupMenu();
    this.setupWindowControls();
  }

  getAppIcon() {
    const iconName = process.platform === 'win32' ? 'icon.ico' 
      : process.platform === 'darwin' ? 'icon.icns' 
      : 'icon.png';
    
    return path.join(__dirname, '../../assets', iconName);
  }

  setupMenu() {
    const template = [
      {
        label: 'Khalistra',
        submenu: [
          { 
            label: 'About Khalistra', 
            click: () => this.showAboutDialog() 
          },
          { type: 'separator' },
          { 
            label: 'Preferences...', 
            accelerator: 'CmdOrCtrl+,',
            click: () => this.openPreferences()
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupWindowControls() {
    if (!this.mainWindow) return;

    // Custom window controls for frameless window
    if (process.platform === 'win32') {
      this.mainWindow.webContents.on('before-input-event', (_, input) => {
        if (input.key === 'F11') {
          this.mainWindow?.setFullScreen(!this.mainWindow.isFullScreen());
        }
      });
    }
  }

  setupIpcHandlers() {
    // App control handlers
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:quit', () => {
      app.quit();
    });

    ipcMain.handle('app:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('app:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.restore();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('app:close', () => {
      this.mainWindow?.close();
    });

    // Window state handlers
    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow?.isMaximized() || false;
    });

    ipcMain.handle('window:isFullScreen', () => {
      return this.mainWindow?.isFullScreen() || false;
    });

    // Settings handlers
    ipcMain.handle('settings:get', (_, key) => {
      return store.get(key);
    });

    ipcMain.handle('settings:set', (_, key, value) => {
      store.set(key, value);
    });
  }

  setupAutoUpdater() {
    if (this.isDev) return;

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      log.info('Update available');
    });

    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded');
      autoUpdater.quitAndInstall();
    });
  }

  saveWindowBounds() {
    if (!this.mainWindow) return;

    const bounds = this.mainWindow.getBounds();
    store.set('windowBounds', {
      width: bounds.width,
      height: bounds.height
    });
  }

  saveWindowState() {
    if (!this.mainWindow) return;

    store.set('windowState', {
      isMaximized: this.mainWindow.isMaximized(),
      isFullScreen: this.mainWindow.isFullScreen()
    });
  }

  showAboutDialog() {
    if (!this.mainWindow) return;
    this.mainWindow.webContents.send('app:showAbout');
  }

  openPreferences() {
    if (!this.mainWindow) return;
    this.mainWindow.webContents.send('app:openPreferences');
  }
}

// Initialize the application
new KhalistraApp();

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith(`http://localhost:`)) {
    // Allow self-signed certificates in development
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

module.exports = KhalistraApp;