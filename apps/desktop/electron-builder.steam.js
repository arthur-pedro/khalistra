module.exports = {
  appId: 'com.khalistra.game',
  productName: 'Khalistra',
  directories: {
    output: 'dist-steam'
  },
  files: [
    'src/**/*',
    'assets/**/*',
    {
      from: '../frontend/out',
      to: 'frontend',
      filter: ['**/*']
    }
  ],
  extraMetadata: {
    main: 'src/main/main.js'
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.ico',
    publisherName: 'Khalistra Studios',
    requestedExecutionLevel: 'asInvoker'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png',
    category: 'Game',
    desktop: {
      Name: 'Khalistra',
      Comment: 'Strategic Ritual Combat Game',
      Categories: 'Game;StrategyGame;'
    }
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'assets/icon.icns',
    category: 'public.app-category.games'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Khalistra'
  },
  // Steam-specific configurations
  steamworks: {
    appId: process.env.STEAM_APP_ID || '0',
    redistributables: ['vcredist_2019_x64']
  },
  publish: null // Disable auto-publish for Steam builds
};