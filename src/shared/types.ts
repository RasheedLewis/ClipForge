export type RendererIpcChannels = 'import-clips' | 'export-video' | 'record-start' | 'record-stop';

export interface IpcStubResponse {
  status: 'error';
  message: string;
}

export interface DesktopApi {
  importClips: () => Promise<IpcStubResponse>;
  exportVideo: () => Promise<IpcStubResponse>;
  recordStart: () => Promise<IpcStubResponse>;
  recordStop: () => Promise<IpcStubResponse>;
}
