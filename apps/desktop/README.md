# Khalistra Desktop

Electron desktop application wrapper for Khalistra game.

## Features

- **Desktop Native**: Custom BrowserWindow with 1280x720 resolution
- **Cross-Platform**: Windows, macOS, and Linux support
- **Steam Ready**: Configured for Steam distribution
- **Auto-Updates**: Built-in update system for post-launch versions
- **Security**: Context isolation and restricted web content access

## Development

```bash
# Install dependencies
pnpm install

# Start development (requires frontend to be running on :3000)
pnpm dev

# Build for production
pnpm build:prod

# Build for Steam distribution
pnpm steam:build
```

## Architecture

```
src/
├── main/          # Main Electron process
│   └── main.js    # Application entry point
└── preload/       # Preload scripts for secure IPC
    └── preload.js # Context bridge for renderer
```

## Steam Integration

The desktop app is configured for Steam distribution with:
- Steamworks SDK integration ready
- Achievements and leaderboards support
- Steam overlay compatibility
- Proper executable packaging

## Build Outputs

- **Development**: Runs Next.js dev server in Electron window
- **Production**: Packages Next.js static export with Electron
- **Steam**: Optimized build with Steam-specific metadata