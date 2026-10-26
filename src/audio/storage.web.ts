import { idbDelete, idbGet, idbPut } from '../db/idb';

/**
 * Web voice notes: the recorder hands back a temporary `blob:` URL, so the
 * audio itself is copied into IndexedDB and the database keeps only its id.
 * Playback gets an object URL, created once per session and cached.
 */
const objectUrls = new Map<string, string>();

export async function recordingUri(fileName: string): Promise<string> {
  const cached = objectUrls.get(fileName);
  if (cached) return cached;
  const blob = await idbGet<Blob>('recordings', fileName);
  if (!blob) throw new Error('Recording not found');
  const url = URL.createObjectURL(blob);
  objectUrls.set(fileName, url);
  return url;
}

/** Copies a finished recording out of the recorder's temporary blob into the diary. */
export async function keepRecording(tempUri: string, entryId: string): Promise<string> {
  const res = await fetch(tempUri);
  const blob = await res.blob();
  const fileName = `${entryId}${extensionFor(blob.type)}`;
  await idbPut('recordings', blob, fileName);
  discardTemp(tempUri);
  return fileName;
}

export function discardTemp(tempUri: string | null | undefined) {
  if (!tempUri || !tempUri.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(tempUri);
  } catch {
    // Nothing to clean up.
  }
}

export async function deleteRecording(fileName: string): Promise<void> {
  const url = objectUrls.get(fileName);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(fileName);
  }
  try {
    await idbDelete('recordings', fileName);
  } catch {
    // Already gone.
  }
}

function extensionFor(mime: string): string {
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('ogg')) return '.ogg';
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('m4a')) return '.m4a';
  if (mime.includes('wav')) return '.wav';
  return '.webm';
}
