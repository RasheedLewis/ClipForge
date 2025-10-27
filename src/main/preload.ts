import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi } from '@shared/types';

const api: DesktopApi = {
  importClips: () => ipcRenderer.invoke('import-clips'),
  exportVideo: () => ipcRenderer.invoke('export-video'),
  recordStart: () => ipcRenderer.invoke('record-start'),
  recordStop: () => ipcRenderer.invoke('record-stop'),
};

contextBridge.exposeInMainWorld('clipforge', api);

declare global {
  interface Window {
    clipforge: DesktopApi;
  }
}
