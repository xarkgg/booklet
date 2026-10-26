import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  CHROME_OUT,
  CHROME_RETURN_SPRING,
  CLOSE_SPRING,
  COLLAPSE_SPRING,
  EASE_OUT,
  EXPAND,
  OPEN,
  REVEAL,
  SHEET_SPRING,
} from '../animation/motion';
import { keepRecording } from '../audio/storage';
import { CalendarSheet } from '../components/CalendarSheet';
import { EntryCard } from '../components/EntryCard';
import { Header } from '../components/Header';
import { HomeFooter } from '../components/HomeFooter';
import { Notebook } from '../components/Notebook';
import type { Page } from '../components/PageFace';
import { PageSpread } from '../components/PageSpread';
import { RecordSheet } from '../components/RecordSheet';
import { WriteSheet } from '../components/WriteSheet';
import { newId } from '../db/entries';
import { useBookLayout } from '../hooks/useBookLayout';
import { useEntries } from '../hooks/useEntries';
import { Alert } from '../lib/alert';
import { formatShort, todayKey, type DayKey } from '../lib/dates';
import * as Haptics from '../lib/haptics';
import { colors } from '../theme';

type Mode = 'home' | 'opening' | 'open' | 'closing';

const haptic = (style: Haptics.ImpactStyle) => {
  Haptics.impact(style);
};

export function BookletScreen() {
  const layout = useBookLayout();
  const { entries, add, updateText, remove, removeAll } = useEntries();

  const [mode, setMode] = useState<Mode>('home');
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [writing, setWriting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [today, setToday] = useState(todayKey);

  // Motion state, all on the UI thread.
  const open = useSharedValue(0);
  const homeChrome = useSharedValue(1);
  const sheetShown = useSharedValue(0);
  const chrome = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const expand = useSharedValue(0);
  const drag = useSharedValue(0);
  const spreadVisible = useDerivedValue<number>(() => (open.value > 0.999 && expand.value <= 0 ? 1 : 0));

  // Keep "today" right if the app stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pages = useMemo<Page[]>(() => {
    const list = selectedDay ? entries.filter((e) => e.date === selectedDay) : entries;
    if (list.length === 0) {
      const day = selectedDay ?? today;
      return [{ key: `blank-${day}`, date: day, entry: null }];
    }
    return list.map((e) => ({ key: e.id, date: e.date, entry: e }));
  }, [entries, selectedDay, today]);

  const daysWithEntries = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const index = Math.min(pageIndex, pages.length - 1);
  const page = pages[index];

  // After saving a new page, turn the book to it.
  useEffect(() => {
    if (!focusId) return;
    const i = pages.findIndex((p) => p.key === focusId);
    if (i >= 0) {
      setPageIndex(i);
      setFocusId(null);
    }
  }, [focusId, pages]);

  // When the visible page changes without a turn (a new entry was saved, a day
  // was picked), fade its text in instead of letting it swap in place.
  const turnedRef = useRef(false);
  const shownKey = useRef(page.key);
  useEffect(() => {
    if (shownKey.current === page.key) return;
    shownKey.current = page.key;
    if (turnedRef.current) {
      turnedRef.current = false;
      return;
    }
    if (mode !== 'open' || expanded) return;
    const fade = withTiming(1, { duration: REVEAL.duration, easing: EASE_OUT });
    textOpacity.value = 0;
    textOpacity.value = writing || recording ? withDelay(REVEAL.delay, fade) : fade;
  }, [page.key, mode, expanded, writing, recording, textOpacity]);

  const writeDay = selectedDay ?? today;

  // ── Open / close ────────────────────────────────────────────────────────
  const openBook = useCallback(() => {
    if (mode !== 'home') return;
    setMode('opening');
    haptic('medium');
    textOpacity.value = 0;
    homeChrome.value = withTiming(0, CHROME_OUT);
    sheetShown.value = withDelay(130, withSpring(1, SHEET_SPRING));
    open.value = withTiming(1, { duration: OPEN.duration, easing: OPEN.easing }, (finished) => {
      if (!finished) return;
      textOpacity.value = withTiming(1, { duration: 140 });
      scheduleOnRN(setMode, 'open');
    });
  }, [mode, homeChrome, open, sheetShown, textOpacity]);

  const closeBook = useCallback(() => {
    if (mode !== 'open' || expanded) return;
    setMode('closing');
    textOpacity.value = withTiming(0, { duration: 80 });
    sheetShown.value = withTiming(0, { duration: 120 });
    homeChrome.value = withDelay(180, withSpring(1, CHROME_RETURN_SPRING));
    open.value = withDelay(
      60,
      withSpring(0, CLOSE_SPRING, (finished) => {
        if (finished) scheduleOnRN(setMode, 'home');
      }),
    );
  }, [mode, expanded, homeChrome, open, sheetShown, textOpacity]);

  // A soft knock when the cover lands shut.
  useAnimatedReaction(
    () => open.value <= 0.01,
    (shut, wasShut) => {
      if (shut && wasShut === false) scheduleOnRN(haptic, 'medium');
    },
  );

  // ── Expand / collapse a page ────────────────────────────────────────────
  const expandPage = useCallback(() => {
    if (mode !== 'open' || expanded) return;
    if (!page.entry) {
      setWriting(true);
      return;
    }
    setExpanded(true);
    haptic('soft');
    drag.value = 0;
    chrome.value = withTiming(0, { duration: 130 });
    expand.value = withTiming(1, { duration: EXPAND.duration, easing: EXPAND.easing });
  }, [mode, expanded, page, chrome, drag, expand]);

  const collapsePage = useCallback(() => {
    drag.value = withTiming(0, { duration: 320 });
    chrome.value = withDelay(180, withSpring(1, CHROME_RETURN_SPRING));
    expand.value = withSpring(0, COLLAPSE_SPRING, (finished) => {
      if (finished) scheduleOnRN(setExpanded, false);
    });
  }, [chrome, drag, expand]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (expanded) {
        collapsePage();
        return true;
      }
      if (mode === 'open') {
        closeBook();
        return true;
      }
      return mode !== 'home';
    });
    return () => sub.remove();
  }, [expanded, mode, collapsePage, closeBook]);

  // Web: Escape mirrors the Android back button.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (expanded) {
        e.preventDefault();
        collapsePage();
      } else if (mode === 'open') {
        e.preventDefault();
        closeBook();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, mode, collapsePage, closeBook]);

  // ── Data actions ────────────────────────────────────────────────────────
  const saveText = useCallback(
    async (text: string) => {
      const entry = await add({ date: writeDay, text });
      setFocusId(entry.id);
      Haptics.success();
    },
    [add, writeDay],
  );

  const saveRecording = useCallback(
    async (tempUri: string, durationMs: number) => {
      const id = newId();
      const audioFile = await keepRecording(tempUri, id);
      await add({ date: writeDay, text: '', audioFile, audioDurationMs: durationMs }, id);
      setFocusId(id);
    },
    [add, writeDay],
  );

  const deleteCurrent = useCallback(async () => {
    if (!page.entry) return;
    const id = page.entry.id;
    collapsePage();
    await remove(id);
  }, [page, collapsePage, remove]);

  const showSettings = useCallback(() => {
    Alert.alert(
      'Booklet',
      `Your dreams are kept only on this phone. Nothing is uploaded, synced or tracked.\n\n${entries.length} ${entries.length === 1 ? 'page' : 'pages'} written.`,
      [
        { text: 'OK', style: 'cancel' },
        ...(entries.length > 0
          ? [
              {
                text: 'Delete all pages',
                style: 'destructive' as const,
                onPress: () =>
                  Alert.alert('Delete every page?', 'All text and voice notes will be erased from this phone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete all',
                      style: 'destructive',
                      onPress: () => {
                        removeAll().catch(() => {});
                        setPageIndex(0);
                      },
                    },
                  ]),
              },
            ]
          : []),
      ],
    );
  }, [entries.length, removeAll]);

  const turnPage = useCallback(
    (dir: 1 | -1) => {
      turnedRef.current = true;
      setPageIndex((i) => Math.max(0, Math.min(pages.length - 1, Math.min(i, pages.length - 1) + dir)));
    },
    [pages.length],
  );

  const selectDay = useCallback((day: DayKey | null) => {
    setSelectedDay(day);
    setPageIndex(0);
  }, []);

  const { bookW, bookH, centerX, centerY, insets } = layout;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />

      {/* Tapping the dark area around the open book closes it. */}
      {mode === 'open' && !expanded && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeBook} accessibilityLabel="Close the booklet" />
      )}

      <Header
        topInset={insets.top}
        dateLabel={formatShort(new Date())}
        open={open}
        chrome={chrome}
        onTitlePress={closeBook}
        onMenuPress={showSettings}
      />

      <Notebook layout={layout} open={open} title="Dreams" subtitle="written by you" />

      {mode === 'home' && (
        <Pressable
          onPress={openBook}
          style={{ position: 'absolute', left: centerX - bookW / 2, top: centerY - bookH / 2, width: bookW, height: bookH }}
          accessibilityRole="button"
          accessibilityLabel="Open your dreams booklet"
        />
      )}

      <PageSpread
        layout={layout}
        pages={pages}
        index={index}
        onTurn={turnPage}
        onTapPage={expandPage}
        visible={spreadVisible}
        textOpacity={textOpacity}
        interactive={mode === 'open' && !expanded}
      />

      <HomeFooter
        bottomInset={insets.bottom}
        shown={homeChrome}
        interactive={mode === 'home'}
        onRecord={() => setRecording(true)}
        onType={() => setWriting(true)}
      />

      <CalendarSheet
        bottomInset={insets.bottom}
        shown={sheetShown}
        chrome={chrome}
        daysWithEntries={daysWithEntries}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
      />

      {expanded && (
        <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <EntryCard
            key={page.key}
            layout={layout}
            page={page}
            position={index + 1}
            count={pages.length}
            expand={expand}
            drag={drag}
            onDismiss={collapsePage}
            onSaveText={(text) => {
              if (page.entry) updateText(page.entry.id, text).catch(() => {});
            }}
            onDelete={() => {
              deleteCurrent().catch(() => {});
            }}
          />
        </Animated.View>
      )}

      <WriteSheet visible={writing} day={writeDay} onSave={saveText} onClosed={() => setWriting(false)} />
      <RecordSheet visible={recording} day={writeDay} onSave={saveRecording} onClosed={() => setRecording(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
});
