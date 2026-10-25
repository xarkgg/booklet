import { Directory, File, Paths } from 'expo-file-system';

/**
 * Voice notes live in the app's private document directory. The database
 * stores only the file name, so entries keep working if the OS moves the
 * app container (it does on iOS updates).
 */
function recordingsDir(): Directory {
  const dir = new Directory(Paths.document, 'recordings');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function recordingUri(fileName: string): string {
  return new File(recordingsDir(), fileName).uri;
}

/** Moves a finished recording out of the recorder's cache into the diary. */
export function keepRecording(tempUri: string, entryId: string): string {
  const source = new File(tempUri);
  const ext = source.extension || '.m4a';
  const fileName = `${entryId}${ext.startsWith('.') ? ext : `.${ext}`}`;
  const target = new File(recordingsDir(), fileName);
  if (target.exists) target.delete();
  source.moveSync(target);
  return fileName;
}

export function discardTemp(tempUri: string | null | undefined) {
  if (!tempUri) return;
  try {
    const f = new File(tempUri);
    if (f.exists) f.delete();
  } catch {
    // Nothing to clean up.
  }
}

export function deleteRecording(fileName: string) {
  try {
    const f = new File(recordingsDir(), fileName);
    if (f.exists) f.delete();
  } catch {
    // Already gone.
  }
}
