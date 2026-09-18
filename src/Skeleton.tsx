import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, DimensionValue, Easing, RefreshControl, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { haptic } from "./haptics";

// Facebook-style loading placeholders: gray shapes that softly pulse
// in the layout of the real content until the data arrives.
const Pulse = createContext<Animated.Value | null>(null);

export function Skeleton({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [value]);
  return <Pulse.Provider value={value}>
    <View style={style} accessibilityRole="progressbar" accessibilityLabel="Loading">{children}</View>
  </Pulse.Provider>;
}

export function Bone({ width = "100%", height = 12, radius = 8, style }: { width?: DimensionValue; height?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }) {
  const value = useContext(Pulse);
  const opacity = value ? value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) : 1;
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "#E2E6EE", opacity }, style]} />;
}

function RowBones({ last }: { last?: boolean }) {
  return <View style={[ui.row, !last && ui.rowBorder]}>
    <View style={ui.grow}>
      <Bone width="75%" height={14} />
      <Bone width="50%" height={11} style={ui.gap6} />
    </View>
    <View style={ui.right}>
      <Bone width={70} height={14} />
      <Bone width={84} height={20} radius={10} style={ui.gap6} />
    </View>
  </View>;
}

/** A white card holding gray transaction rows. */
export function SkeletonRows({ count = 5 }: { count?: number }) {
  return <View style={ui.card}>
    {Array.from({ length: count }, (_, index) => <RowBones key={index} last={index === count - 1} />)}
  </View>;
}

export function HomeSkeleton() {
  return <Skeleton style={ui.page}>
    <View style={ui.pickers}>
      {[0, 1].map((key) => <View key={key} style={ui.grow}><Bone width={80} height={10} /><Bone height={54} radius={16} style={ui.gap8} /></View>)}
    </View>
    <View style={ui.hero}>
      <Bone width={90} height={10} style={ui.onDark} />
      <View style={ui.heroStats}>
        {[0, 1, 2].map((key) => <View key={key} style={ui.grow}><Bone width="60%" height={10} style={ui.onDark} /><Bone width="80%" height={22} style={[ui.gap8, ui.onDark]} /></View>)}
      </View>
    </View>
    <Bone width={170} height={12} style={ui.section} />
    <SkeletonRows count={5} />
  </Skeleton>;
}

export function TransactionsSkeleton() {
  return <Skeleton style={ui.page}>
    <View style={ui.titleRow}>
      <View style={ui.grow}><Bone width={170} height={26} /><Bone width={220} height={12} style={ui.gap8} /></View>
      <Bone width={48} height={48} radius={16} />
    </View>
    <View style={ui.tabs}>{[0, 1, 2].map((key) => <Bone key={key} width={80} height={14} />)}</View>
    <SkeletonRows count={8} />
  </Skeleton>;
}

export function BillsSkeleton() {
  return <Skeleton style={ui.page}>
    <Bone width={90} height={28} />
    <Bone width={230} height={12} style={ui.gap8} />
    <View style={[ui.tabs, { marginTop: 20 }]}>{[0, 1].map((key) => <Bone key={key} height={44} radius={14} style={ui.grow} />)}</View>
    {[0, 1, 2, 3, 4].map((key) => <View key={key} style={[ui.card, ui.billCard]}><RowBones last /></View>)}
  </Skeleton>;
}

/** Bill cards for the Bills tab list. */
export function BillCardsSkeleton({ count = 5 }: { count?: number }) {
  return <Skeleton>
    {Array.from({ length: count }, (_, key) => <View key={key} style={[ui.card, ui.billCard]}><RowBones last /></View>)}
  </Skeleton>;
}

export function ChartsSkeleton() {
  const bars = [0.9, 0.7, 0.55, 0.45, 0.35, 0.25];
  return <Skeleton style={ui.page}>
    <View style={ui.titleRow}><Bone width={48} height={48} radius={16} /><Bone width={120} height={24} style={{ marginLeft: 14 }} /></View>
    <Bone height={54} radius={16} style={ui.section} />
    <View style={[ui.card, ui.panel]}>
      <Bone width={160} height={14} />
      {bars.map((size, index) => <View key={index} style={ui.barRow}><Bone width={80} height={10} /><Bone width={`${size * 60}%`} height={14} radius={7} /></View>)}
    </View>
    <View style={[ui.card, ui.panel]}>
      <Bone width={180} height={14} />
      <Bone height={150} radius={14} style={ui.gap12} />
    </View>
  </Skeleton>;
}

/** Stacked label + input placeholders for a form. */
export function FormSkeleton({ fields = 4, style }: { fields?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton style={style}>
    {Array.from({ length: fields }, (_, index) => <View key={index} style={ui.field}>
      <Bone width={110} height={11} />
      <Bone height={52} radius={14} style={ui.gap8} />
    </View>)}
  </Skeleton>;
}

/** Cards with an avatar, two lines and a footer strip (businesses, users). */
export function CardListSkeleton({ count = 3, style }: { count?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton style={style}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={[ui.card, ui.panel]}>
      <View style={ui.cardHead}>
        <Bone width={48} height={48} radius={16} />
        <View style={ui.grow}><Bone width="65%" height={15} /><Bone width="40%" height={11} style={ui.gap6} /></View>
      </View>
      <Bone height={44} radius={12} style={ui.gap12} />
    </View>)}
  </Skeleton>;
}

/** Placeholder cards for "choose an uploaded bill" lists. */
export function BillOptionsSkeleton({ count = 2 }: { count?: number }) {
  return <Skeleton>
    {Array.from({ length: count }, (_, index) => <View key={index} style={ui.option}>
      <Bone width="70%" height={14} />
      <Bone width="45%" height={11} style={ui.gap6} />
    </View>)}
  </Skeleton>;
}

/** Transaction details: header, dark summary card, fields and the bill card. */
export function DetailsSkeleton() {
  return <Skeleton style={ui.page}>
    <View style={ui.titleRow}><Bone width={48} height={48} radius={16} /><Bone width={200} height={24} style={{ marginLeft: 14 }} /></View>
    <View style={[ui.hero, { marginTop: 0 }]}>
      <Bone width="45%" height={12} style={ui.onDark} />
      <Bone width="55%" height={34} style={[ui.gap12, ui.onDark]} />
      <Bone width="80%" height={16} style={[ui.gap12, ui.onDark]} />
      <Bone width="65%" height={12} style={[ui.gap8, ui.onDark]} />
    </View>
    <Bone width={120} height={12} style={ui.section} />
    <View style={[ui.card, ui.panel]}>
      {[0, 1].map((row) => <View key={row} style={[ui.pickers, row ? ui.gap12 : null]}>
        {[0, 1].map((key) => <View key={key} style={ui.grow}><Bone width={60} height={11} /><Bone height={48} radius={14} style={ui.gap8} /></View>)}
      </View>)}
    </View>
    <View style={[ui.card, ui.panel]}>
      <Bone width={50} height={14} />
      <View style={[ui.cardHead, ui.gap12]}><Bone width={60} height={60} radius={14} /><View style={ui.grow}><Bone width="60%" height={14} /><Bone width="80%" height={11} style={ui.gap6} /></View></View>
    </View>
  </Skeleton>;
}

/** Simple list rows for sheets (e.g. categories). */
export function SheetRowsSkeleton({ count = 6 }: { count?: number }) {
  return <Skeleton>
    {Array.from({ length: count }, (_, index) => <View key={index} style={ui.sheetRow}><Bone width={`${50 + ((index * 17) % 35)}%`} height={14} /></View>)}
  </Skeleton>;
}

/** A photo-sized gray box. */
export function ImageSkeleton({ height = 220, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton style={style}><Bone height={height} radius={14} /></Skeleton>;
}

/** Icon + two lines, used inside a select field while its data loads. */
export function FieldSkeleton() {
  return <Skeleton style={[ui.cardHead, ui.grow]}>
    <Bone width={42} height={42} radius={12} />
    <View style={ui.grow}><Bone width="55%" height={13} /><Bone width="35%" height={10} style={ui.gap6} /></View>
  </Skeleton>;
}

/** One line of text-sized gray, for a name or label. */
export function TextSkeleton({ width = 140, height = 16, style }: { width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton style={style}><Bone width={width} height={height} /></Skeleton>;
}

/**
 * Pull-down-to-refresh for a ScrollView. Returns the refreshControl prop
 * (undefined when there is nothing to refresh). A light tap marks the start.
 */
export function usePullRefresh(onRefresh?: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false);
  if (!onRefresh) return undefined;
  const refresh = async () => {
    haptic.light();
    setRefreshing(true);
    try { await onRefresh(); } catch { /* the screen shows its own error */ } finally { setRefreshing(false); }
  };
  return <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} colors={["#5C70FF"]} tintColor="#5C70FF" />;
}

const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F4F6FA", padding: 16, paddingTop: 18 },
  grow: { flex: 1, minWidth: 0 },
  gap6: { marginTop: 6 },
  gap8: { marginTop: 8 },
  gap12: { marginTop: 12 },
  section: { marginTop: 22, marginBottom: 12 },
  pickers: { flexDirection: "row", gap: 10 },
  hero: { marginTop: 16, borderRadius: 24, backgroundColor: "#1B2748", padding: 18 },
  onDark: { backgroundColor: "#34426B" },
  heroStats: { flexDirection: "row", gap: 12, marginTop: 20 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF1F6" },
  right: { alignItems: "flex-end" },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  tabs: { flexDirection: "row", gap: 18, marginBottom: 16 },
  billCard: { marginBottom: 10 },
  panel: { padding: 16, marginBottom: 14 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  field: { marginBottom: 18 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#EEF1F6" },
  option: { borderRadius: 16, borderWidth: 1, borderColor: "#E4E8F1", backgroundColor: "#FFF", padding: 16, marginTop: 8 },
});
