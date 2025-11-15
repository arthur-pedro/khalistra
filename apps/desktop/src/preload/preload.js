const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App controls
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close')
  },

  // Window state
  window: {
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    isFullScreen: () => ipcRenderer.invoke('window:isFullScreen')
  },

  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  },

  // Steam integration (will be implemented later)
  steam: {
    isAvailable: () => Promise.resolve(false), // Placeholder
    getPlayerName: () => Promise.resolve('Player'), // Placeholder
    unlockAchievement: () => Promise.resolve(false), // Placeholder - achievement name not used yet
    submitScore: () => Promise.resolve(false) // Placeholder - leaderboard/score not used yet
  },

  // Event listeners
  on: (channel, callback) => {
    const validChannels = ['app:showAbout', 'app:openPreferences'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeListener: (channel, callback) => {
    const validChannels = ['app:showAbout', 'app:openPreferences'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});