import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { usePressFeedback } from '../animation/usePressFeedback';
import { canRecord } from '../audio/canRecord';
import { hoverable } from '../lib/hover';
import { colors, fonts } from '../theme';

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x={7.5} y={2} width={7} height={11} rx={3.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M4.5 10.5a6.5 6.5 0 0 0 13 0" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Line x1={11} y1={17} x2={11} y2={20} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function TypeIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={22} viewBox="0 0 26 22">
      <Path d="M2 19 8 3l6 16M4.4 13h7.2" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <Line x1={19} y1={3} x2={19} y2={19} stroke={color} strokeWidth={1.5} />
      <Line x1={16.5} y1={3} x2={21.5} y2={3} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={16.5} y1={19} x2={21.5} y2={19} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function Half({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { style, handlers } = usePressFeedback();
  return (
    <Pressable
      style={styles.half}
      onPress={onPress}
      {...handlers}
      {...hoverable('pill')}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.halfInner, style]}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * The glossy two-part "Record | Type" pill at the bottom of the home screen.
 * Where the platform cannot record (some browsers), it shows only Type.
 */
export function ActionPill({
  onRecord,
  onType,
  maxWidth,
}: {
  onRecord: () => void;
  onType: () => void;
  /** Caps the pill's width on wide layouts (desktop web). */
  maxWidth?: number;
}) {
  return (
    <View style={[styles.shadowWrap, maxWidth != null && { maxWidth }]}>
      <View style={styles.pill}>
        <LinearGradient
          colors={[colors.pillTop, colors.pillBottom]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.gloss} />
        {canRecord && (
          <>
            <Half label="Record" icon={<MicIcon color={colors.text} />} onPress={onRecord} />
            <View style={styles.divider} />
          </>
        )}
        <Half label="Type" icon={<TypeIcon color={colors.text} />} onPress={onType} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  pill: {
    height: 68,
    borderRadius: 40,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gloss: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  half: {
    flex: 1,
  },
  halfInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  divider: {
    width: 1.5,
    backgroundColor: colors.pillDivider,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
});
