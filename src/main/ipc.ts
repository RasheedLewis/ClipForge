import { ipcMain } from 'electron';
import type { IpcStubResponse, RendererIpcChannels } from '@shared/types';

const notImplemented = (channel: RendererIpcChannels): IpcStubResponse => ({
  status: 'error',
  message: `${channel} is not implemented yet.`,
});

export const registerIpcHandlers = () => {
  const channels: RendererIpcChannels[] = [
    'import-clips',
    'export-video',
    'record-start',
    'record-stop',
  ];

  channels.forEach((channel) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, async () => notImplemented(channel));
  });
};
