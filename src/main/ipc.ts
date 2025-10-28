import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { dialog, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
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
  const stubChannels: RendererIpcChannels[] = ['export-video', 'record-start', 'record-stop'];

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
      console.info('[IPC] Media metadata resolved', metadata);
      return {
        status: 'ok',
        data: metadata,
      };
    } catch (error) {
      console.error('[IPC] Metadata lookup failed', mediaPath, error);
      return {
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to retrieve metadata for the provided media.',
      };
    }
  };

  const importHandler = async (): Promise<IpcResponse<string[]>> => {
    const result = await dialog.showOpenDialog({
      title: 'Import Video Clips',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePaths.length) {
      console.info('[IPC] Import dialog cancelled.');
      return {
        status: 'ok',
        data: [],
      };
    }

    console.info('[IPC] Import dialog selected files', result.filePaths);
    return {
      status: 'ok',
      data: result.filePaths,
    };
  };

  const fileUrlHandler = async (
    _event: unknown,
    mediaPath: unknown,
  ): Promise<IpcResponse<string>> => {
    if (typeof mediaPath !== 'string' || mediaPath.trim().length === 0) {
      return {
        status: 'error',
        message: 'A valid media path is required.',
      };
    }

    try {
      const absolutePath = path.resolve(mediaPath);
      await access(absolutePath, fsConstants.R_OK);
      const fileUrl = `clipforge-media://local?path=${encodeURIComponent(absolutePath)}`;
      console.info('[IPC] Generated media URL', { mediaPath: absolutePath, fileUrl });
      return {
        status: 'ok',
        data: fileUrl,
      };
    } catch (error) {
      return {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Unable to resolve the provided media path.',
      };
    }
  };

  ipcMain.removeHandler('import-clips');
  ipcMain.handle('import-clips', importHandler);

  ipcMain.removeHandler('media:getMetadata');
  ipcMain.handle('media:getMetadata', metadataHandler);

  ipcMain.removeHandler('media:getFileUrl');
  ipcMain.handle('media:getFileUrl', fileUrlHandler);

  const resolveDropHandler = async (
    _event: unknown,
    uriList: unknown,
  ): Promise<IpcResponse<string[]>> => {
    if (typeof uriList !== 'string' || uriList.trim().length === 0) {
      return {
        status: 'error',
        message: 'No file URIs were provided.',
      };
    }

    const candidates = uriList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        try {
          return fileURLToPath(line);
        } catch (error) {
          console.warn('[IPC] Failed to parse drop URI', line, error);
          return null;
        }
      })
      .filter((value): value is string => Boolean(value));

    if (!candidates.length) {
      return {
        status: 'error',
        message: 'Unable to resolve dropped files.',
      };
    }

    const resolved = await Promise.all(
      candidates.map(async (candidate) => {
        const absolutePath = path.resolve(candidate);
        try {
          await access(absolutePath, fsConstants.R_OK);
          return absolutePath;
        } catch {
          return null;
        }
      }),
    );

    const deduped = Array.from(
      new Set(resolved.filter((value): value is string => Boolean(value))),
    );

    if (!deduped.length) {
      return {
        status: 'error',
        message: 'No accessible files found in drop operation.',
      };
    }

    console.info('[IPC] Resolved dropped files', deduped);
    return {
      status: 'ok',
      data: deduped,
    };
  };

  ipcMain.removeHandler('media:resolveDrop');
  ipcMain.handle('media:resolveDrop', resolveDropHandler);
};
