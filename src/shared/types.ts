export type RendererIpcChannels =
  | 'import-clips'
  | 'export-video'
  | 'record-start'
  | 'record-stop'
  | 'media:getMetadata';

export interface IpcStubResponse {
  status: 'error';
  message: string;
}

export interface IpcSuccessResponse<T> {
  status: 'ok';
  data: T;
}

export type IpcResponse<T = unknown> = IpcSuccessResponse<T> | IpcStubResponse;

export interface MediaMetadata {
  path: string;
  format: string;
  duration: number;
  size: number;
  bitRate?: number;
  video?: {
    codec: string;
    width?: number;
    height?: number;
    frameRate?: string;
  };
  audio?: Array<{
    codec: string;
    channels?: number;
    sampleRate?: number;
  }>;
}

export interface DesktopApi {
  importClips: () => Promise<IpcStubResponse>;
  exportVideo: () => Promise<IpcStubResponse>;
  recordStart: () => Promise<IpcStubResponse>;
  recordStop: () => Promise<IpcStubResponse>;
  getMediaMetadata: (path: string) => Promise<IpcResponse<MediaMetadata>>;
}
