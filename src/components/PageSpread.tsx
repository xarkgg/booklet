import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type DerivedValue, type SharedValue } from 'react-native-reanimated';
import type { BookLayout } from '../hooks/useBookLayout';
import { colors } from '../theme';
import { PageFace, type Page } from './PageFace';

type Props = {
  layout: BookLayout;
  pages: Page[];
  index: number;
  /** 1 when the spread is the visible surface. */
  visible: DerivedValue<number>;
  /** Fades the page text in once the paper has stopped moving. */
  textOpacity: SharedValue<number>;
};

type HalfProps = {
  page: Page | undefined;
  half: 'top' | 'bottom';
  width: number;
  height: number;
  position: number;
  count: number;
  textOpacity: SharedValue<number>;
};

/** One half of a page, with the paper shading that falls into the fold. */
function Half({ page, half, width, height, position, count, textOpacity }: HalfProps) {
  const h = height / 2;
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  return (
    <View style={{ width, height: h, overflow: 'hidden' }}>
      <LinearGradient
        colors={
          half === 'top'
            ? [colors.paperLight, colors.paper, '#aaa6a8', colors.paperFold]
            : [colors.paperFold, '#a6a2a5', colors.paper, colors.paperLight]
        }
        locations={half === 'top' ? [0, 0.55, 0.9, 1] : [0, 0.08, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {page && (
        <Animated.View style={[{ position: 'absolute', top: half === 'top' ? 0 : -h }, textStyle]}>
          <PageFace page={page} width={width} height={height} position={position} count={count} />
        </Animated.View>
      )}
    </View>
  );
}

/** The open spread: one page shown across an upper and lower half. */
export function PageSpread({ layout, pages, index, visible, textOpacity }: Props) {
  const { spreadW: w, spreadH: h, spreadLeft, spreadTop } = layout;
  const half = h / 2;
  const count = pages.length;
  const current = pages[index];
  const container = useAnimatedStyle(() => ({ opacity: visible.value }));
  const halfProps = { width: w, height: h, count, textOpacity };

  return (
    <Animated.View
      style={[styles.spread, { left: spreadLeft, top: spreadTop, width: w, height: h }, container]}
      pointerEvents="none"
    >
      <View style={[styles.paper, { width: w, height: h }]}>
        <View style={[styles.region, { top: 0, height: half }]}>
          <Half page={current} half="top" position={index + 1} {...halfProps} />
        </View>
        <View style={[styles.region, { top: half, height: half }]}>
          <Half page={current} half="bottom" position={index + 1} {...halfProps} />
        </View>
        <View style={[styles.fold, { top: half - 1 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spread: {
    position: 'absolute',
    borderRadius: 12,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  paper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.paper,
  },
  region: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  fold: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(60,55,58,0.18)',
  },
});
