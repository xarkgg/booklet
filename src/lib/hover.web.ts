/**
 * Tags an element for the hover styles in public/index.html. They apply only
 * under `@media (hover: hover) and (pointer: fine)`, so a tap never leaves a
 * sticky hover state on a touch screen.
 */
export function hoverable(kind: 'soft' | 'pill' | 'day'): object {
  return { dataSet: { hover: kind } };
}
