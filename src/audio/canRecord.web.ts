/** Browsers need getUserMedia and MediaRecorder to record a voice note. */
export const canRecord: boolean =
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  typeof MediaRecorder !== 'undefined';
