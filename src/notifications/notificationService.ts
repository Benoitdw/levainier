import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TimerState } from '../domain/types';
import { computeSecondsToSectionEnd } from '../domain/timerEngine';

// ── Configuration au démarrage ────────────────────────────────────────────────

export async function initNotifications(): Promise<boolean> {
  // Demander la permission (iOS obligatoire, Android 13+)
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Créer les channels Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('step_bell', {
      name: "Fin d'étape",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'bell.wav',
      vibrationPattern: [0, 100],
    });

    await Notifications.setNotificationChannelAsync('section_alarm', {
      name: 'Fin de section',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'alarm.wav',
      vibrationPattern: [0, 300, 200, 300],
      bypassDnd: true,
    });
  }

  // Comportement quand une notif arrive en avant-plan
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return true;
}

// ── Planification des notifications ──────────────────────────────────────────

/**
 * Planifie toutes les notifications pour le protocole courant :
 * - Une cloche par fin d'étape
 * - Une alarme par fin de section
 * Annule d'abord toutes les notifications existantes.
 */
export async function scheduleAllNotifications(state: TimerState): Promise<void> {
  await cancelAllNotifications();

  if (!state.soundEnabled) return;
  if (state.waitingForSectionValidation) return;

  const section = state.sections[state.currentSectionIdx];
  if (!section) return;

  let offset = 0; // secondes depuis maintenant

  // Étapes restantes dans la section courante
  for (let ti = state.currentStepIdx; ti < section.steps.length; ti++) {
    const step = section.steps[ti];
    const secondsForThisStep = ti === state.currentStepIdx
      ? state.secondsLeft
      : step.dureeMin * 60;

    offset += secondsForThisStep;
    const isLastStepOfSection = ti === section.steps.length - 1;
    const isLastSection = state.currentSectionIdx === state.sections.length - 1;

    if (isLastStepOfSection) {
      if (isLastSection) {
        // Fin du protocole — alarme finale
        await scheduleNotification({
          title: 'Bonne fournée !',
          body: 'Le protocole est terminé.',
          sound: 'alarm.wav',
          channelId: 'section_alarm',
          seconds: offset,
        });
      } else {
        const nextSection = state.sections[state.currentSectionIdx + 1];
        await scheduleNotification({
          title: `${section.name} terminée !`,
          body: `Appuyez pour valider → ${nextSection?.name ?? ''}`,
          sound: 'alarm.wav',
          channelId: 'section_alarm',
          seconds: offset,
        });
      }
    } else {
      const nextStep = section.steps[ti + 1];
      await scheduleNotification({
        title: nextStep.name,
        body: `→ ${nextStep.dureeMin} min`,
        sound: 'bell.wav',
        channelId: 'step_bell',
        seconds: offset,
      });
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Helper interne ────────────────────────────────────────────────────────────

async function scheduleNotification(opts: {
  title: string;
  body: string;
  sound: string;
  channelId: string;
  seconds: number;
}): Promise<void> {
  if (opts.seconds <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: opts.sound,
      ...(Platform.OS === 'android' ? { channelId: opts.channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: opts.seconds,
      repeats: false,
    },
  });
}
