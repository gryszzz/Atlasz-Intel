/// <reference types="vite/client" />

type AtlaszDesktopMeta = {
  name: string
  version: string
  platform: string
  dataPath: string
}

type AtlaszDesktopBridge = {
  getAppMeta: () => Promise<AtlaszDesktopMeta>
  openExternal: (url: string) => Promise<void>
}

interface Window {
  atlaszDesktop?: AtlaszDesktopBridge
}
