import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from './AnimatedBackground';
import { Logo } from './Logo';
import { colors, fonts, gradient, timing } from '@/theme/tokens';

const ND = Platform.OS !== 'web';

type BlobSpec = {
  /** ตำแหน่งเริ่มต้น (นอกจอ) เป็นสัดส่วนของความกว้าง/สูงจอ จากจุดกึ่งกลาง */
  from: [number, number];
  /** ตำแหน่งลอยก่อนประกบ */
  float: [number, number];
  rotFrom: number;
  rotTo: number;
  /** รัศมีมุมไม่เท่ากันให้เป็นรูปทรงอินทรีย์ (สัดส่วนของขนาด) */
  radii: [number, number, number, number]; // tl, tr, br, bl
  scale: number;
};

// 3 ก้อนตามเฟรมที่ 2-4 ใน Figma: ก้อนบนขวา, ก้อนล่างซ้าย, ก้อนใหญ่กลาง
const BLOBS: BlobSpec[] = [
  { from: [0.9, -0.75], float: [0.32, -0.3], rotFrom: -35, rotTo: 8, radii: [0.5, 0.35, 0.55, 0.45], scale: 0.95 },
  { from: [-0.9, 0.85], float: [-0.28, 0.3], rotFrom: 30, rotTo: -6, radii: [0.4, 0.55, 0.35, 0.2], scale: 1.0 },
  { from: [0.85, 0.9], float: [0.1, 0.1], rotFrom: -20, rotTo: 12, radii: [0.55, 0.45, 0.5, 0.4], scale: 1.05 },
];

/**
 * การเคลื่อนที่แบบ "กระดึบ ๆ" (คืบคลานเหมือนอะมีบา):
 * แบ่งเป็น n จังหวะ — แต่ละจังหวะพุ่งไปข้างหน้า (65% ของช่วง) แล้วหยุดพักเล็กน้อย (35%)
 * ปรับ n ต่อก้อนเพื่อให้แต่ละก้อนขยับไม่พร้อมกัน
 */
function inchKeyframes(n: number) {
  const move = 0.65 / n;
  const input: number[] = [];
  const pos: number[] = []; // สัดส่วนตำแหน่ง 0..1
  const stretch: number[] = []; // 0 = ปกติ, 1 = ยืดสุด/หดสุด
  for (let k = 0; k < n; k++) {
    const s = k / n;
    input.push(s, s + move / 2, s + move);
    pos.push(k / n, (k + 0.5) / n, (k + 1) / n);
    stretch.push(0, 1, -1);
  }
  input.push(1);
  pos.push(1);
  stretch.push(0);
  return { input, pos, stretch };
}

/**
 * ก้อนเขียว 1 ก้อน
 * ช่วง enter  : กระดึบเข้ามาที่ตำแหน่งลอย
 * ช่วง merge  : ไหลเข้าหากึ่งกลาง + "รูปทรงค่อย ๆ กลายเป็นวงกลม + ขนาดเท่ากัน + หมุนตรง"
 *               ทั้ง 3 ก้อนจึงหลอมกลายเป็นวงกลมเดียวกันจริง ๆ (ไม่ใช่ซ้อนแล้วสลับเป็นภาพอื่น)
 *               จบด้วยเด้งนุ่ม ๆ แบบเจลลี่
 * mergeR      : ค่าเดียวกับ merge แต่ใช้ JS driver (borderRadius ใช้ native driver ไม่ได้)
 */
function Blob({
  spec,
  size,
  w,
  h,
  enter,
  merge,
  mergeR,
  expand,
  surges,
}: {
  spec: BlobSpec;
  size: number;
  w: number;
  h: number;
  enter: Animated.Value;
  merge: Animated.Value;
  mergeR: Animated.Value;
  expand: Animated.Value;
  surges: number;
}) {
  const [fx, fy] = spec.float;
  const [sx, sy] = spec.from;
  const kf = inchKeyframes(surges);
  const ease = Easing.inOut(Easing.quad);
  const smooth = Easing.inOut(Easing.cubic);

  const enterX = enter.interpolate({
    inputRange: kf.input,
    outputRange: kf.pos.map((p) => sx * w + (fx - sx) * w * p),
    easing: ease,
  });
  const enterY = enter.interpolate({
    inputRange: kf.input,
    outputRange: kf.pos.map((p) => sy * h + (fy - sy) * h * p),
    easing: ease,
  });
  const mergeX = merge.interpolate({ inputRange: [0, 1], outputRange: [0, -fx * w], easing: smooth });
  const mergeY = merge.interpolate({ inputRange: [0, 1], outputRange: [0, -fy * h], easing: smooth });

  // เอียงตัวไปมาเล็กน้อยทุกจังหวะ ระหว่างคืบหน้า
  const rotate = enter.interpolate({
    inputRange: kf.input,
    outputRange: kf.pos.map((p, i) => {
      const sway = kf.stretch[i] * 6;
      return `${spec.rotFrom + (spec.rotTo - spec.rotFrom) * p + sway}deg`;
    }),
  });
  // ตอนหลอม: หมุนกลับมาตรง (0°) ให้ตรงกับวงกลมสุดท้าย
  const mergeRotate = merge.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${-spec.rotTo}deg`], easing: smooth });

  // พุ่ง = ยืดตามทาง + บางลง, พัก = หดกลับ (squash & stretch)
  const squashX = enter.interpolate({ inputRange: kf.input, outputRange: kf.stretch.map((s) => 1 + 0.16 * s) });
  const squashY = enter.interpolate({ inputRange: kf.input, outputRange: kf.stretch.map((s) => 1 - 0.12 * s) });

  // ขนาด: ค่อย ๆ กลายเป็นขนาดวงกลมเท่ากัน (1.0) แล้วเด้งเจลลี่นิดหน่อย
  const mergeScale = merge.interpolate({
    inputRange: [0, 0.65, 0.85, 1],
    outputRange: [spec.scale, 1.07, 0.97, 1],
  });

  // รูปทรง: รัศมีมุมแต่ละมุมค่อย ๆ ไปเป็นครึ่งหนึ่งของขนาด = วงกลมสมบูรณ์
  const [tl, tr, br, bl] = spec.radii.map((r) => r * size);
  const rad = (r0: number) => mergeR.interpolate({ inputRange: [0, 1], outputRange: [r0, size / 2], easing: smooth });

  // ส่งต่อให้ "วงกลมรวม" ตอนเริ่มขยาย (ตำแหน่ง/ขนาดเท่ากันพอดี จึงไม่กระตุก)
  const opacity = expand.interpolate({ inputRange: [0, 0.02], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (w - size) / 2,
        top: (h - size) / 2,
        width: size,
        height: size,
        opacity,
        transform: [
          { translateX: Animated.add(enterX, mergeX) },
          { translateY: Animated.add(enterY, mergeY) },
          { rotate },
          { rotate: mergeRotate },
          { scaleX: Animated.multiply(squashX, mergeScale) },
          { scaleY: Animated.multiply(squashY, mergeScale) },
        ],
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          overflow: 'hidden',
          borderTopLeftRadius: rad(tl),
          borderTopRightRadius: rad(tr),
          borderBottomRightRadius: rad(br),
          borderBottomLeftRadius: rad(bl),
        }}
      >
        <LinearGradient colors={gradient.green} style={{ flex: 1 }} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * ลำดับ Splash ตาม Figma:
 * 1) พื้นหลังมืด 2) ก้อนเขียวกระดึบเข้ามา 3) หลอมรวมเป็นวงกลมเดียว
 * 4) วงกลมขยายเต็มจอ 5) หน้าโหลด (โลโก้ + KIT- GLE + progress)
 */
export function SplashIntro({ onFinish }: { onFinish: () => void }) {
  const { width: w, height: h } = useWindowDimensions();
  const enter = useMemo(() => new Animated.Value(0), []);
  const merge = useMemo(() => new Animated.Value(0), []);
  const mergeR = useMemo(() => new Animated.Value(0), []);
  const expand = useMemo(() => new Animated.Value(0), []);
  const content = useMemo(() => new Animated.Value(0), []);
  const progress = useMemo(() => new Animated.Value(0), []);
  const finished = useRef(false);

  const baseSize = Math.min(w, h) * 0.62;
  const expandScale = (Math.hypot(w, h) / baseSize) * 1.1;

  useEffect(() => {
    const anim = Animated.sequence([
      // linear: จังหวะกระดึบ ๆ ถูกกำหนดใน inchKeyframes แล้ว
      Animated.timing(enter, { toValue: 1, duration: timing.blobsIn, easing: Easing.linear, useNativeDriver: ND }),
      // หลอมรวม: transform (native) + รูปทรง (JS) วิ่งพร้อมกัน
      Animated.parallel([
        Animated.timing(merge, { toValue: 1, duration: timing.merge, easing: Easing.linear, useNativeDriver: ND }),
        Animated.timing(mergeR, { toValue: 1, duration: timing.merge, easing: Easing.linear, useNativeDriver: false }),
      ]),
      Animated.timing(expand, { toValue: 1, duration: timing.expand, easing: Easing.in(Easing.cubic), useNativeDriver: ND }),
      Animated.timing(content, { toValue: 1, duration: timing.content, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
      // progress ใช้ width จึงต้อง JS driver
      Animated.timing(progress, { toValue: 1, duration: timing.progress, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]);
    anim.start(({ finished: ok }) => {
      if (ok && !finished.current) {
        finished.current = true;
        onFinish();
      }
    });
    return () => anim.stop();
  }, [enter, merge, mergeR, expand, content, progress, onFinish]);

  // วงกลมรวม: ปรากฏทันทีที่เริ่มขยาย (แทนที่ 3 ก้อนที่หลอมเป็นวงกลมเดียวกันแล้ว) แล้วขยายเต็มจอ
  const circleOpacity = expand.interpolate({ inputRange: [0, 0.02], outputRange: [0, 1], extrapolate: 'clamp' });
  const circleScale = expand.interpolate({ inputRange: [0, 1], outputRange: [1, expandScale] });
  // เงามืดใต้วงกลม (เฟรมที่ 5)
  const shadowOpacity = Animated.multiply(
    merge.interpolate({ inputRange: [0.6, 1], outputRange: [0, 0.55], extrapolate: 'clamp' }),
    expand.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' }),
  );
  const fullBgOpacity = expand.interpolate({ inputRange: [0.9, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const contentOpacity = content;
  const contentY = content.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.root}>
      {/* เฟรม 1: พื้นมืด (root bg) */}

      {/* เงามืดใต้วงกลม — วางไว้ "ก่อน" ก้อนเขียวเพื่อให้อยู่ด้านหลังเสมอ ไม่ทับก้อนเขียว */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (w - baseSize) / 2,
          top: (h - baseSize) / 2 + baseSize * 0.22,
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2,
          backgroundColor: '#1c1c1c',
          opacity: shadowOpacity,
        }}
      />

      {/* เฟรม 2-4: ก้อนเขียวกระดึบเข้ามา แล้วหลอมเป็นวงกลม */}
      {BLOBS.map((b, i) => (
        <Blob
          key={i}
          spec={b}
          size={baseSize}
          w={w}
          h={h}
          enter={enter}
          merge={merge}
          mergeR={mergeR}
          expand={expand}
          surges={[4, 3, 5][i] ?? 4}
        />
      ))}

      {/* เฟรม 5: วงกลมรวมขยายเต็มจอ */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (w - baseSize) / 2,
          top: (h - baseSize) / 2,
          width: baseSize,
          height: baseSize,
          opacity: circleOpacity,
          transform: [{ scale: circleScale }],
        }}
      >
        <LinearGradient colors={gradient.green} style={{ flex: 1, borderRadius: baseSize / 2 }} />
      </Animated.View>

      {/* เฟรม 6-7: พื้นเขียวเต็มจอ + เซลล์ลอย + เนื้อหาโหลด */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fullBgOpacity }]} pointerEvents="none">
        <LinearGradient colors={gradient.green} style={StyleSheet.absoluteFill} />
        <AnimatedBackground />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
        <Logo size={Math.min(w * 0.55, 260)} />
        <Text style={styles.title}>KIT- GLE</Text>
        <View style={styles.titleLine} />
        <Text style={styles.subtitle}>smart trinket</Text>
        <Text style={styles.tagline}>
          New of trinket in lifestyle has{'\n'}new for option Make By : MAX
        </Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <View style={styles.loadingRow}>
          <View style={styles.loadingLine} />
          <Text style={styles.loadingText}>LOADING SYSTEM</Text>
          <View style={styles.loadingLine} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark, overflow: 'hidden' },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    marginTop: 8,
    fontSize: 54,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
    fontFamily: fonts.title,
  },
  titleLine: { width: '78%', height: 2, backgroundColor: colors.white, marginTop: 2 },
  subtitle: { marginTop: 6, fontSize: 22, color: colors.white },
  tagline: {
    marginTop: 14,
    fontSize: 11,
    lineHeight: 16,
    color: colors.whiteSoft,
    textAlign: 'center',
    fontFamily: fonts.mono,
  },
  track: {
    marginTop: 22,
    width: '100%',
    maxWidth: 360,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.trackBg,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.progressFill, borderRadius: 4 },
  loadingRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', width: '80%', maxWidth: 320 },
  loadingLine: { flex: 1, height: 1, backgroundColor: colors.whiteSoft },
  loadingText: {
    marginHorizontal: 10,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.white,
    fontFamily: fonts.mono,
  },
});
