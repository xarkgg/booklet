import Svg, { Path } from 'react-native-svg';

/** Crescent moon with a small four-point star, the notebook's cover mark. */
export function Emblem({ size = 26, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <Path
        d="M12.6 5.2a8.4 8.4 0 1 0 8.2 10.3 6.6 6.6 0 0 1-8.2-10.3Z"
        fill={color}
      />
      <Path
        d="M19.2 3.4l.75 2.05 2.05.75-2.05.75-.75 2.05-.75-2.05-2.05-.75 2.05-.75.75-2.05Z"
        fill={color}
      />
    </Svg>
  );
}
