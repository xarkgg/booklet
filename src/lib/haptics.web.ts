/** Browsers have no haptics we want to use; every call is a no-op. */
export type ImpactStyle = 'light' | 'medium' | 'soft';

export function impact(_style: ImpactStyle) {}

export function selection() {}

export function success() {}
