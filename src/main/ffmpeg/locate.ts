import fs from 'node:fs';
import path from 'node:path';
import { path as ffmpegInstallerPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobeInstallerPath } from '@ffprobe-installer/ffprobe';

export interface FfmpegBinaryPaths {
  ffmpeg: string;
  ffprobe: string;
}

const isExecutable = (candidate: string | undefined): candidate is string => {
  if (!candidate) {
    return false;
  }

  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const normalizeBinary = (binaryPath: string) =>
  process.platform === 'win32' ? binaryPath.replace(/\\/g, '/') : binaryPath;

const resolveBinary = (envKey: 'FFMPEG_PATH' | 'FFPROBE_PATH', fallback: string) => {
  const fromEnv = process.env[envKey];

  if (isExecutable(fromEnv)) {
    return normalizeBinary(fromEnv);
  }

  if (isExecutable(fallback)) {
    return normalizeBinary(fallback);
  }

  return null;
};

let resolvedPaths: FfmpegBinaryPaths | null = null;

export const getFfmpegBinaryPaths = (): FfmpegBinaryPaths => {
  if (resolvedPaths) {
    return resolvedPaths;
  }

  const ffmpegPath = resolveBinary('FFMPEG_PATH', ffmpegInstallerPath);
  const ffprobePath = resolveBinary('FFPROBE_PATH', ffprobeInstallerPath);

  if (!ffmpegPath || !ffprobePath) {
    const missing = [
      !ffmpegPath ? 'FFMPEG_PATH env var or bundled ffmpeg binary' : null,
      !ffprobePath ? 'FFPROBE_PATH env var or bundled ffprobe binary' : null,
    ]
      .filter(Boolean)
      .join(', ');

    throw new Error(`FFmpeg tools missing: ${missing}`);
  }

  resolvedPaths = {
    ffmpeg: ffmpegPath,
    ffprobe: ffprobePath,
  };

  return resolvedPaths;
};

export const ensureFfmpegInPath = () => {
  const { ffmpeg, ffprobe } = getFfmpegBinaryPaths();

  const currentPath = process.env.PATH ?? '';
  const binariesDir = path.dirname(ffmpeg);

  if (!currentPath.split(path.delimiter).includes(binariesDir)) {
    process.env.PATH = `${binariesDir}${path.delimiter}${currentPath}`;
  }

  return { ffmpeg, ffprobe };
};
