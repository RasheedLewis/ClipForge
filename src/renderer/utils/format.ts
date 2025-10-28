const unitTable = ['bytes', 'KB', 'MB', 'GB'];

export const formatDuration = (durationSeconds: number | undefined) => {
  if (!Number.isFinite(durationSeconds)) {
    return '0:00';
  }

  const totalSeconds = Math.max(0, Math.round(durationSeconds ?? 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatBytes = (bytes: number | undefined) => {
  if (!Number.isFinite(bytes) || (bytes ?? 0) <= 0) {
    return '—';
  }

  let value = bytes ?? 0;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < unitTable.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${unitTable[unitIndex]}`;
};

export const formatBitrate = (bitRate: number | undefined) => {
  if (!Number.isFinite(bitRate) || (bitRate ?? 0) <= 0) {
    return '—';
  }

  const mbps = (bitRate ?? 0) / 1_000_000;
  return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`;
};
