import { useCallback, useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { EDGE, TURN } from '../animation/motion';
import type { BookLayout } from '../hooks/useBookLayout';
import { colors } from '../theme';
import { PageFace, type Page } from './PageFace';

type Props = {
  layout: BookLayout;
  pages: Page[];
  index: number;
  /** Called once a turn completes: +1 = older page, -1 = newer page. */
  onTurn: (direction: 1 | -1) => void;
  /** Tapping a page (without dragging). */
  onTapPage?: () => void;
  /** 1 when the spread is the visible, interactive surface. */
  visible: DerivedValue<number>;
  /** Fades the page text in once the paper has stopped moving. */
  textOpacity: SharedValue<number>;
  interactive: boolean;
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

/**
 * The open spread. Pages turn over the horizontal fold like a flip calendar:
 * drag down to turn the upper leaf onto the lower half (older entry), drag up
 * to turn the lower leaf back (newer entry).
 */
export function PageSpread({
  layout,
  pages,
  index,
  onTurn,
  onTapPage,
  visible,
  textOpacity,
  interactive,
}: Props) {
  const { spreadW: w, spreadH: h, spreadLeft, spreadTop } = layout;
  const half = h / 2;
  const turn = useSharedValue(0);
  const count = pages.length;
  // Mirrored onto the UI thread so the gesture never reads a stale page.
  const hasNext = useSharedValue(index < count - 1);
  const hasPrev = useSharedValue(index > 0);
  // Set once per drag when the finger first pushes past the first or last page.
  const edgeHit = useSharedValue(false);
  const reduceMotion = useReducedMotion();
  const edgeMax = (reduceMotion ? EDGE.reducedMaxDegrees : EDGE.maxDegrees) / 180;

  useLayoutEffect(() => {
    hasNext.value = index < count - 1;
    hasPrev.value = index > 0;
    turn.value = 0;
  }, [index, count, pages, turn, hasNext, hasPrev]);

  const commit = useCallback(
    (dir: 1 | -1) => {
      Haptics.impact('light');
      onTurn(dir);
    },
    [onTurn],
  );

  const bumpEdge = useCallback(() => Haptics.impact('soft'), []);

  const pan = usePanGesture({
    enabled: interactive,
    activeOffsetY: [-12, 12],
    failOffsetX: [-30, 30],
    onActivate: () => {
      'worklet';
      edgeHit.value = false;
    },
    onUpdate: (e) => {
      'worklet';
      const d = e.translationY / (h * TURN.dragFraction);
      const atEdge = (d > 0 && !hasNext.value) || (d < 0 && !hasPrev.value);
      if (atEdge) {
        // Rubber band: approaches edgeMax asymptotically, never a hard stop.
        const x = Math.abs(d) * EDGE.resistance;
        turn.value = Math.sign(d) * edgeMax * (1 - 1 / (x + 1));
        if (!edgeHit.value) {
          edgeHit.value = true;
          scheduleOnRN(bumpEdge);
        }
      } else {
        turn.value = Math.max(-1, Math.min(1, d));
      }
    },
    onDeactivate: (e) => {
      'worklet';
      const t = turn.value;
      const dir: 1 | -1 = t > 0 ? 1 : -1;
      const allowed = dir > 0 ? hasNext.value : hasPrev.value;
      const fling = dir > 0 ? e.velocityY > TURN.commitVelocity : e.velocityY < -TURN.commitVelocity;
      if (allowed && (Math.abs(t) > TURN.commitProgress || fling)) {
        turn.value = withTiming(dir, { duration: TURN.duration, easing: TURN.easing }, (finished) => {
          if (finished) scheduleOnRN(commit, dir);
        });
      } else if (!allowed) {
        turn.value = reduceMotion ? withTiming(0, EDGE.reducedReturn) : withSpring(0, EDGE.spring);
      } else {
        turn.value = withSpring(0, { dampingRatio: 0.8, duration: 380 });
      }
    },
  });

  const handleTap = useCallback(() => onTapPage?.(), [onTapPage]);
  const tap = useTapGesture({
    enabled: interactive && !!onTapPage,
    maxDistance: 10,
    onActivate: () => {
      'worklet';
      scheduleOnRN(handleTap);
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  const current = pages[index];
  const next = pages[index + 1];
  const prev = pages[index - 1];

  const container = useAnimatedStyle(() => ({ opacity: visible.value }));

  const showWhenForward = useAnimatedStyle(() => ({ opacity: turn.value > 0 ? 1 : 0 }));
  const showWhenBackward = useAnimatedStyle(() => ({ opacity: turn.value < 0 ? 1 : 0 }));

  // Shadow cast by the moving leaf on what it uncovers / approaches.
  const underTopShadow = useAnimatedStyle(() => ({
    opacity: turn.value > 0 ? (1 - turn.value) * 0.3 : Math.sin(-turn.value * Math.PI) * 0.22,
  }));
  const underBottomShadow = useAnimatedStyle(() => ({
    opacity: turn.value < 0 ? (1 + turn.value) * 0.3 : Math.sin(turn.value * Math.PI) * 0.22,
  }));

  const forwardLeaf = useAnimatedStyle(() => {
    const t = Math.max(0, turn.value);
    return {
      opacity: t > 0 ? 1 : 0,
      transform: [
        { perspective: 1400 },
        { rotateX: `${-180 * t}deg` },
        { rotateZ: `${-Math.sin(t * Math.PI) * TURN.peelDegrees}deg` },
      ],
    };
  });
  const backwardLeaf = useAnimatedStyle(() => {
    const t = Math.max(0, -turn.value);
    return {
      opacity: t > 0 ? 1 : 0,
      transform: [
        { perspective: 1400 },
        { rotateX: `${180 * t}deg` },
        { rotateZ: `${Math.sin(t * Math.PI) * TURN.peelDegrees}deg` },
      ],
    };
  });
  const fwdFront = useAnimatedStyle(() => ({ opacity: turn.value < 0.5 ? 1 : 0 }));
  const fwdBack = useAnimatedStyle(() => ({ opacity: turn.value >= 0.5 ? 1 : 0 }));
  const bwdFront = useAnimatedStyle(() => ({ opacity: turn.value > -0.5 ? 1 : 0 }));
  const bwdBack = useAnimatedStyle(() => ({ opacity: turn.value <= -0.5 ? 1 : 0 }));
  const fwdShade = useAnimatedStyle(() => {
    const t = Math.max(0, turn.value);
    return { opacity: interpolate(Math.abs(0.5 - t), [0, 0.5], [0.4, 0], Extrapolation.CLAMP) * (t > 0 ? 1 : 0) };
  });
  const bwdShade = useAnimatedStyle(() => {
    const t = Math.max(0, -turn.value);
    return { opacity: interpolate(Math.abs(0.5 - t), [0, 0.5], [0.4, 0], Extrapolation.CLAMP) * (t > 0 ? 1 : 0) };
  });

  const halfProps = { width: w, height: h, count, textOpacity };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.spread,
          { left: spreadLeft, top: spreadTop, width: w, height: h },
          layout.desktop && styles.pointer,
          container,
        ]}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <View style={[styles.paper, { width: w, height: h }]}>
          {/* Upper half: the current page, or the next page while turning forward. */}
          <View style={[styles.region, { top: 0, height: half }]}>
            <Half page={current} half="top" position={index + 1} {...halfProps} />
            <Animated.View style={[StyleSheet.absoluteFill, showWhenForward]}>
              <Half page={next} half="top" position={index + 2} {...halfProps} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, underTopShadow]} />
          </View>
          {/* Lower half: the current page, or the previous page while turning back. */}
          <View style={[styles.region, { top: half, height: half }]}>
            <Half page={current} half="bottom" position={index + 1} {...halfProps} />
            <Animated.View style={[StyleSheet.absoluteFill, showWhenBackward]}>
              <Half page={prev} half="bottom" position={index} {...halfProps} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, underBottomShadow]} />
          </View>
          <View style={[styles.fold, { top: half - 1 }]} />
        </View>

        {/* Forward leaf: hinged on the fold, folds down over the lower half. */}
        <Animated.View
          style={[styles.leaf, styles.leafTop, { top: 0, height: half, width: w, transformOrigin: 'bottom' }, forwardLeaf]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, fwdFront]}>
            <Half page={current} half="top" position={index + 1} {...halfProps} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flipY, fwdBack]}>
            <Half page={next} half="bottom" position={index + 2} {...halfProps} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, fwdShade]} />
        </Animated.View>

        {/* Backward leaf: hinged on the fold, folds up over the upper half. */}
        <Animated.View
          style={[styles.leaf, styles.leafBottom, { top: half, height: half, width: w, transformOrigin: 'top' }, backwardLeaf]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, bwdFront]}>
            <Half page={current} half="bottom" position={index + 1} {...halfProps} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flipY, bwdBack]}>
            <Half page={prev} half="top" position={index} {...halfProps} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, bwdShade]} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
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
  leaf: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  leafTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  leafBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  flipY: {
    transform: [{ scaleY: -1 }],
  },
  shadow: {
    backgroundColor: '#000',
  },
  pointer: {
    cursor: 'pointer',
  },
});
