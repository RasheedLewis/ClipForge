import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import { ensureFfmpegInPath } from './locate';
import type { MediaMetadata } from '@shared/types';

const paths = ensureFfmpegInPath();

ffmpeg.setFfmpegPath(paths.ffmpeg);
ffmpeg.setFfprobePath(paths.ffprobe);

const isVideoStream = (stream: ffmpeg.FfprobeStream) => stream.codec_type === 'video';

export const getMediaMetadata = async (mediaPath: string): Promise<MediaMetadata> => {
  if (typeof mediaPath !== 'string' || mediaPath.trim().length === 0) {
    throw new Error('A valid media path is required.');
  }

  const absolutePath = path.resolve(mediaPath);

  try {
    await access(absolutePath, fsConstants.R_OK);
  } catch {
    throw new Error('Media file is not accessible or does not exist.');
  }

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(absolutePath, (error, metadata) => {
      if (error) {
        reject(new Error(`Failed to read metadata: ${error.message}`));
        return;
      }

      const videoStream = metadata.streams?.find(isVideoStream);

      resolve({
        path: absolutePath,
        format: metadata.format?.format_long_name ?? metadata.format?.format_name ?? 'unknown',
        duration: metadata.format?.duration ?? 0,
        size: metadata.format?.size ? Number(metadata.format.size) : 0,
        bitRate: metadata.format?.bit_rate ? Number(metadata.format.bit_rate) : undefined,
        video: videoStream
          ? {
              codec: videoStream.codec_name ?? 'unknown',
              width: videoStream.width ?? undefined,
              height: videoStream.height ?? undefined,
              frameRate: videoStream.avg_frame_rate ?? undefined,
            }
          : undefined,
        audio: metadata.streams
          ?.filter((stream) => stream.codec_type === 'audio')
          .map((stream) => ({
            codec: stream.codec_name ?? 'unknown',
            channels: stream.channels ?? undefined,
            sampleRate: stream.sample_rate ? Number(stream.sample_rate) : undefined,
          })),
      });
    });
  });
};
