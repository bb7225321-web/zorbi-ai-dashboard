// ============================================================================
// MY PHARMACY POS — preload script (context-isolated)
// ============================================================================
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("posDesktop", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
