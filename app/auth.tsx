import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import theme from '@/constants/theme';

// ─── Liveness steps ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 'position',  instruction: 'Position your face\ninside the frame',   icon: 'person-circle-outline', check: 'Face detected ✓'      },
  { id: 'blink',     instruction: 'Blink slowly\ntwo times',                icon: 'eye-outline',           check: 'Blink detected ✓'     },
  { id: 'turn',      instruction: 'Slowly turn your head\nto the right',    icon: 'arrow-forward-circle',  check: 'Head turn detected ✓' },
  { id: 'smile',     instruction: 'Give a natural\nsmile',                  icon: 'happy-outline',         check: 'Smile detected ✓'    },
];

type Stage = 'intro' | 'liveness' | 'success' | 'failed';

export default function Auth() {
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage]   = useState<Stage>('intro');
  const [step,  setStep]    = useState(0);
  const [timer, setTimer]   = useState(3);
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const stepRef  = useRef(step);
  stepRef.current = step;

  // Pulse animation for the face ring
  useEffect(() => {
    if (stage !== 'liveness') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [stage]);

  // Auto-advance steps (simulated liveness — real implementation would use MLKit / Vision)
  useEffect(() => {
    if (stage !== 'liveness') return;
    setTimer(3);
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false,
    }).start();

    let count = 3;
    timerRef.current = setInterval(() => {
      count--;
      setTimer(count);
      if (count <= 0) {
        clearInterval(timerRef.current);
        const next = stepRef.current + 1;
        if (next >= STEPS.length) setStage('success');
        else { setStep(next); }
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [step, stage]);

  const startLiveness = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Required', 'Camera permission is needed for liveness verification.');
        return;
      }
    }
    setStep(0); setStage('liveness');
  };

  const enter = () => router.replace('/(tabs)');
  const retry = () => { setStep(0); setStage('intro'); };

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const cur = STEPS[step];

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (stage === 'intro') return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      <View style={s.center}>
        <View style={s.shieldWrap}>
          <Ionicons name="shield-checkmark" size={60} color={theme.gold} />
        </View>
        <Text style={s.title}>Identity Verification</Text>
        <Text style={s.sub}>We need to verify your identity before{'\n'}you can access your financial dashboard.</Text>

        <View style={s.stepsList}>
          {STEPS.map((st, i) => (
            <View key={st.id} style={s.stepItem}>
              <View style={[s.stepNum, { backgroundColor: theme.goldDim, borderColor: `${theme.gold}44` }]}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={s.stepItemText}>{st.instruction.replace('\n', ' ')}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={startLiveness}>
          <Ionicons name="camera-outline" size={18} color="#111" />
          <Text style={s.primaryBtnText}>Begin Verification</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Liveness ────────────────────────────────────────────────────────────────
  if (stage === 'liveness') return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      {/* Camera feed */}
      <CameraView style={StyleSheet.absoluteFill} facing="front" />

      {/* Dark overlay with oval cutout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={s.overlay} />
      </View>

      {/* Top instruction */}
      <View style={s.livenessTop}>
        <Text style={s.stepCounter}>Step {step + 1} of {STEPS.length}</Text>
        <View style={s.progressBarBg}>
          <Animated.View style={[s.progressBarFill, { width: barWidth }]} />
        </View>
      </View>

      {/* Face oval */}
      <View style={s.ovalWrap} pointerEvents="none">
        <Animated.View style={[s.oval, { transform: [{ scale: pulse }] }]}>
          <View style={s.ovalInner} />
        </Animated.View>
      </View>

      {/* Bottom instruction card */}
      <View style={s.instructionCard}>
        <View style={[s.instrIcon, { backgroundColor: theme.goldDim }]}>
          <Ionicons name={cur.icon as any} size={28} color={theme.gold} />
        </View>
        <Text style={s.instrText}>{cur.instruction}</Text>
        <View style={s.timerRow}>
          <View style={[s.timerDot, { backgroundColor: timer > 1 ? theme.gold : theme.income }]} />
          <Text style={s.timerText}>Detecting… {timer}s</Text>
        </View>
        {/* Completed steps */}
        <View style={s.doneSteps}>
          {STEPS.slice(0, step).map(st => (
            <View key={st.id} style={s.doneChip}>
              <Ionicons name="checkmark-circle" size={13} color={theme.income} />
              <Text style={s.doneChipText}>{st.check}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );

  // ── Success ─────────────────────────────────────────────────────────────────
  if (stage === 'success') return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      <View style={s.center}>
        <View style={s.successRing}>
          <Ionicons name="checkmark-circle" size={80} color={theme.income} />
        </View>
        <Text style={s.title}>Verified!</Text>
        <Text style={s.sub}>Identity confirmed. You can now{'\n'}access your financial dashboard.</Text>
        {STEPS.map(st => (
          <View key={st.id} style={s.doneChip}>
            <Ionicons name="checkmark-circle" size={14} color={theme.income} />
            <Text style={s.doneChipText}>{st.check}</Text>
          </View>
        ))}
        <TouchableOpacity style={[s.primaryBtn, { marginTop: 32, backgroundColor: theme.income }]} onPress={enter}>
          <Ionicons name="arrow-forward" size={18} color="#111" />
          <Text style={s.primaryBtnText}>Enter Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Failed ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      <View style={s.center}>
        <Ionicons name="close-circle" size={80} color={theme.expense} />
        <Text style={s.title}>Verification Failed</Text>
        <Text style={s.sub}>We couldn't verify your identity.{'\n'}Please try again in good lighting.</Text>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: theme.expense }]} onPress={retry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={[s.primaryBtnText, { color: '#fff' }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: theme.bg },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  shieldWrap:      { width: 110, height: 110, borderRadius: 55, backgroundColor: theme.goldDim, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: `${theme.gold}33` },
  title:           { fontSize: 26, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 10 },
  sub:             { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  stepsList:       { width: '100%', gap: 12, marginBottom: 32 },
  stepItem:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum:         { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepNumText:     { color: theme.gold, fontWeight: '700', fontSize: 14 },
  stepItemText:    { fontSize: 14, color: theme.subtext, flex: 1 },
  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.gold, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%' },
  primaryBtnText:  { color: '#111', fontWeight: '800', fontSize: 16 },
  // Liveness
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  livenessTop:     { paddingTop: 60, paddingHorizontal: 28, zIndex: 2 },
  stepCounter:     { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  progressBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.gold, borderRadius: 3 },
  ovalWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  oval:            { width: 220, height: 290, borderRadius: 120, borderWidth: 3, borderColor: theme.gold, alignItems: 'center', justifyContent: 'center' },
  ovalInner:       { width: 210, height: 280, borderRadius: 115, backgroundColor: 'transparent' },
  instructionCard: { margin: 20, backgroundColor: `${theme.card}f0`, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.border, zIndex: 2, gap: 8 },
  instrIcon:       { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  instrText:       { fontSize: 18, fontWeight: '700', color: theme.text, textAlign: 'center', lineHeight: 26 },
  timerRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerDot:        { width: 8, height: 8, borderRadius: 4 },
  timerText:       { fontSize: 13, color: theme.subtext },
  doneSteps:       { gap: 6, width: '100%' },
  doneChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.incomeDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4 },
  doneChipText:    { fontSize: 12, color: theme.income, fontWeight: '600' },
  successRing:     { marginBottom: 24 },
});