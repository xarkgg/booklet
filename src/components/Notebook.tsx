import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { OPEN } from '../animation/motion';
import type { BookLayout } from '../hooks/useBookLayout';
import { colors, fonts } from '../theme';
import { Emblem } from './Emblem';

type Props = {
  layout: BookLayout;
  /** 0 = closed on the home screen, 1 = open spread. */
  open: SharedValue<number>;
  title: string;
  subtitle: string;
};

/**
 * The notebook as a physical object: a page block and a cover hinged on the
 * spine. The whole book rolls a quarter turn while the cover swings open, so
 * the spine ends up horizontal and the spread reads as an upper and lower
 * page — exactly how the reference recording opens.
 */
export function Notebook({ layout, open, title, subtitle }: Props) {
  const { bookW, bookH, centerX, centerY } = layout;

  const bookStyle = useAnimatedStyle(() => {
    const p = open.value;
    // Unclamped so the closing spring can swing past upright and settle.
    const roll = p * OPEN.roll;
    const lean = Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI) * OPEN.lean;
    const recenter = interpolate(p, [0, 1], [-bookW / 2, 0], Extrapolation.CLAMP);
    const sx = interpolate(p, [0, 1], [1, OPEN.openScaleX], Extrapolation.CLAMP);
    const sy = interpolate(p, [0, 1], [1, OPEN.openScaleY], Extrapolation.CLAMP);
    return {
      // The flat spread takes over once fully open.
      opacity: p > 0.999 ? 0 : 1,
      transform: [
        { perspective: OPEN.perspective * 1.6 },
        { rotateZ: `${roll}deg` },
        { rotateX: `${lean}deg` },
        { scaleX: sx },
        { scaleY: sy },
        { translateX: recenter },
      ],
    };
  });

  const coverStyle = useAnimatedStyle(() => {
    const angle = interpolate(open.value, [0, OPEN.coverEnd], [0, -180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: OPEN.perspective }, { rotateY: `${angle}deg` }],
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const angle = interpolate(open.value, [0, OPEN.coverEnd], [0, 180], Extrapolation.CLAMP);
    return { opacity: angle < 90 ? 1 : 0 };
  });
  const backStyle = useAnimatedStyle(() => {
    const angle = interpolate(open.value, [0, OPEN.coverEnd], [0, 180], Extrapolation.CLAMP);
    return { opacity: angle >= 90 ? 1 : 0 };
  });

  // The cover darkens as it turns edge-on to the light.
  const coverShade = useAnimatedStyle(() => {
    const angle = interpolate(open.value, [0, OPEN.coverEnd], [0, 180], Extrapolation.CLAMP);
    const edgeOn = 1 - Math.abs(90 - angle) / 90;
    return { opacity: edgeOn * 0.45 };
  });

  // Shadow the lifting cover throws on the first page.
  const pageShadow = useAnimatedStyle(() => {
    const t = interpolate(open.value, [0, OPEN.coverEnd * 0.5, OPEN.coverEnd], [0, 0.35, 0], Extrapolation.CLAMP);
    return { opacity: t };
  });

  // Fore-edge thickness, visible only while the cover is lifting.
  const thickness = useAnimatedStyle(() => {
    const t = interpolate(open.value, [0, OPEN.coverEnd], [0, 1], Extrapolation.CLAMP);
    const w = Math.sin(t * Math.PI) * bookW * 0.07;
    return { width: w, opacity: t > 0 && t < 1 ? 1 : 0 };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.book,
        { left: centerX - bookW, top: centerY - bookH / 2, width: bookW * 2, height: bookH },
        bookStyle,
      ]}
    >
      {/* Page block (becomes the lower page). */}
      <View style={[styles.pages, { left: bookW, width: bookW, height: bookH }]}>
        <LinearGradient
          colors={[colors.paperFold, colors.paper, colors.paperLight]}
          locations={[0, 0.18, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, pageShadow]} />
      </View>
      <Animated.View style={[styles.thickness, { left: bookW * 2 - 2, height: bookH - 6 }, thickness]}>
        <LinearGradient
          colors={[colors.paperEdge, colors.paper, colors.paperEdge, colors.paperFold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Cover, hinged on the spine. */}
      <Animated.View
        style={[styles.cover, { left: bookW, width: bookW, height: bookH }, coverStyle]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.coverFront, frontStyle]}>
          <LinearGradient
            colors={['#444245', colors.cover, '#363437']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.spineShade} />
          <View style={[styles.coverContent, { paddingTop: bookH * 0.16, paddingBottom: bookH * 0.09 }]}>
            <View style={styles.coverTitleBlock}>
              <Text style={[styles.coverTitle, { fontSize: bookW * 0.15 }]}>{title}</Text>
              <Text style={[styles.coverSubtitle, { fontSize: bookW * 0.05 }]}>{subtitle}</Text>
            </View>
            <Emblem size={bookW * 0.12} color={colors.coverSubtle} />
          </View>
        </Animated.View>
        {/* Inside of the cover (the upper page once open). Mirrored so it reads correctly. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.coverBack, backStyle]}>
          <LinearGradient
            colors={[colors.paperFold, colors.paper, colors.paperLight]}
            locations={[0, 0.18, 1]}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.shadow, coverShade]} />
      </Animated.View>
    </Animated.View>
  );
}

const RADIUS = 10;

const styles = StyleSheet.create({
  book: {
    position: 'absolute',
  },
  pages: {
    position: 'absolute',
    top: 0,
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    overflow: 'hidden',
  },
  thickness: {
    position: 'absolute',
    top: 3,
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    overflow: 'hidden',
  },
  shadow: {
    backgroundColor: '#000',
  },
  cover: {
    position: 'absolute',
    top: 0,
    transformOrigin: 'left',
  },
  coverFront: {
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    overflow: 'hidden',
    elevation: 18,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 10, height: 16 },
  },
  coverBack: {
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    overflow: 'hidden',
    transform: [{ scaleX: -1 }],
  },
  spineShade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  coverContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverTitleBlock: {
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: fonts.display,
    color: colors.coverText,
    letterSpacing: 0.3,
  },
  coverSubtitle: {
    fontFamily: fonts.body,
    color: colors.coverSubtle,
    marginTop: 2,
  },
});
