import { ipcMain } from 'electron';
import type {
  IpcResponse,
  IpcStubResponse,
  MediaMetadata,
  RendererIpcChannels,
} from '@shared/types';
import { getMediaMetadata } from './ffmpeg/meta';

const notImplemented = (channel: RendererIpcChannels): IpcStubResponse => ({
  status: 'error',
  message: `${channel} is not implemented yet.`,
});

export const registerIpcHandlers = () => {
  const stubChannels: RendererIpcChannels[] = [
    'import-clips',
    'export-video',
    'record-start',
    'record-stop',
  ];

  stubChannels.forEach((channel) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, async () => notImplemented(channel));
  });

  const metadataHandler = async (
    _event: unknown,
    mediaPath: unknown,
  ): Promise<IpcResponse<MediaMetadata>> => {
    if (typeof mediaPath !== 'string' || mediaPath.trim().length === 0) {
      return {
        status: 'error',
        message: 'A valid media path is required.',
      };
    }

    try {
      const metadata = await getMediaMetadata(mediaPath);
      return {
        status: 'ok',
        data: metadata,
      };
    } catch (error) {
      return {
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to retrieve metadata for the provided media.',
      };
    }
  };

  ipcMain.removeHandler('media:getMetadata');
  ipcMain.handle('media:getMetadata', metadataHandler);
};
