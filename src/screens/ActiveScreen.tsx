import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimerStore } from '../store/timerStore';
import { ChronoTimeline } from '../components/ChronoTimeline';
import { SectionGate } from '../components/SectionGate';
import { StepCard } from '../components/StepCard';
import {
  formatTime, formatHour,
  computeElapsedSeconds, computeTotalSeconds,
} from '../domain/timerEngine';
import {
  scheduleAllNotifications,
  cancelAllNotifications,
} from '../notifications/notificationService';
import { colors, spacing, radius, typography } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Active'>;
};

export function ActiveScreen({ navigation }: Props) {
  const {
    timer, phase,
    advanceStepAction, validateSectionAction,
    toggleCheck, resetTimer, soundEnabled,
  } = useTimerStore();

  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bellSoundRef = useRef<Audio.Sound | null>(null);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);

  // Rediriger si timer terminé
  useEffect(() => {
    if (phase === 'done') {
      navigation.replace('Done');
    }
  }, [phase]);

  // Charger les sons
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    (async () => {
      const { sound: bell } = await Audio.Sound.createAsync(
        require('../assets/sounds/bell.wav')
      );
      bellSoundRef.current = bell;

      const { sound: alarm } = await Audio.Sound.createAsync(
        require('../assets/sounds/alarm.wav')
      );
      alarmSoundRef.current = alarm;
    })();

    return () => {
      bellSoundRef.current?.unloadAsync();
      alarmSoundRef.current?.unloadAsync();
    };
  }, []);

  // Tick toutes les secondes
  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      const { timer: t, advanceStepAction: adv } = useTimerStore.getState();
      if (!t || t.waitingForSectionValidation) return;

      if (t.secondsLeft > 1) {
        useTimerStore.setState(s => ({
          timer: s.timer ? { ...s.timer, secondsLeft: s.timer.secondsLeft - 1 } : null,
        }));
      } else {
        // Fin d'étape
        const section = t.sections[t.currentSectionIdx];
        const isLastStep = t.currentStepIdx >= section.steps.length - 1;
        if (isLastStep) {
          playAlarm();
        } else {
          playBell();
        }
        adv();
        // Replanifier les notifications après avancement
        setTimeout(() => {
          const { timer: newT } = useTimerStore.getState();
          if (newT) scheduleAllNotifications(newT);
        }, 50);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [paused]);

  async function playBell() {
    if (!soundEnabled) return;
    try {
      await bellSoundRef.current?.replayAsync();
    } catch {}
  }

  async function playAlarm() {
    if (!soundEnabled) return;
    try {
      await alarmSoundRef.current?.replayAsync();
    } catch {}
  }

  function handleValidateSection() {
    validateSectionAction();
    setTimeout(() => {
      const { timer: t } = useTimerStore.getState();
      if (t) scheduleAllNotifications(t);
    }, 50);
  }

  function handleStop() {
    Alert.alert('Arrêter le timer ?', 'Votre progression sera perdue.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Arrêter',
        style: 'destructive',
        onPress: () => {
          cancelAllNotifications();
          resetTimer();
          navigation.replace('Home');
        },
      },
    ]);
  }

  if (!timer) return null;

  const section = timer.sections[timer.currentSectionIdx];
  const step = section?.steps[timer.currentStepIdx];
  const elapsed = computeElapsedSeconds(timer);
  const total = computeTotalSeconds(timer.sections);
  const remaining = total - elapsed;
  const projectedEnd = Date.now() + remaining * 1000;
  const nextSection = timer.sections[timer.currentSectionIdx + 1] ?? null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Section courante */}
        <Text style={styles.sectionLabel}>{section?.name}</Text>

        {/* Étape courante + countdown */}
        <Text style={styles.stepName}>{step?.name}</Text>
        <Text style={styles.countdown}>{formatTime(timer.secondsLeft)}</Text>

        {/* Heure de fin projetée */}
        <Text style={styles.projectedEnd}>
          Fin totale prévue : {formatHour(projectedEnd)}
        </Text>

        {/* Timeline */}
        <ChronoTimeline
          sections={timer.sections}
          currentSectionIdx={timer.currentSectionIdx}
          currentStepIdx={timer.currentStepIdx}
          checkedStepIds={timer.checkedStepIds}
          elapsedSeconds={elapsed}
          totalSeconds={total}
        />

        {/* Étapes de la section courante */}
        <View style={styles.stepsList}>
          {section?.steps.map((st, ti) => (
            <StepCard
              key={st.id}
              step={st}
              isActive={ti === timer.currentStepIdx}
              isChecked={timer.checkedStepIds.includes(st.id)}
              onCheck={() => toggleCheck(st.id)}
              onSkip={ti === timer.currentStepIdx ? advanceStepAction : () => {}}
            />
          ))}
        </View>
      </ScrollView>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setPaused(p => !p)}
        >
          <Text style={styles.pauseBtnText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
          <Text style={styles.stopBtnText}>✕ Arrêter</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay fin de section */}
      {section && (
        <SectionGate
          visible={timer.waitingForSectionValidation}
          currentSection={section}
          nextSection={nextSection}
          onValidate={handleValidateSection}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  countdown: {
    fontSize: 72,
    fontWeight: '300',
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  projectedEnd: {
    ...typography.small,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepsList: {
    marginTop: spacing.md,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtnText: {
    fontSize: 20,
  },
  stopBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
