import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimerStore } from '../store/timerStore';
import { QRScanModal } from '../components/QRScanModal';
import {
  computeTotalSeconds, formatTotalLabel, formatHour,
} from '../domain/timerEngine';
import { scheduleAllNotifications } from '../notifications/notificationService';
import type { ChronoSection } from '../domain/types';
import { colors, spacing, radius, typography } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Config'>;
};

export function ConfigScreen({ navigation }: Props) {
  const {
    sections, setSections,
    addSection, removeSection,
    addStep, removeStep,
    updateSectionName, updateStepName, updateStepDuree,
    startTimer, saveCustomPreset,
  } = useTimerStore();

  const [showQR, setShowQR] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const total = computeTotalSeconds(sections);
  const projectedEnd = Date.now() + total * 1000;

  function handleStart() {
    if (sections.length === 0 || !sections.some(s => s.steps.length > 0)) {
      Alert.alert('Protocole vide', 'Ajoutez au moins une section avec une étape.');
      return;
    }
    startTimer();
    // Planifier les notifications après startTimer (le store met à jour timer)
    setTimeout(() => {
      const { timer } = useTimerStore.getState();
      if (timer) scheduleAllNotifications(timer);
    }, 100);
    navigation.navigate('Active');
  }

  function handleSave() {
    const name = saveName.trim();
    if (!name) {
      Alert.alert('Nom requis', 'Donnez un nom à ce protocole.');
      return;
    }
    saveCustomPreset(name);
    setShowSaveModal(false);
    setSaveName('');
    Alert.alert('Sauvegardé', `"${name}" ajouté à vos protocoles.`);
  }

  function handleQRScanned(scannedSections: ChronoSection[]) {
    setSections(scannedSections);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.totalLabel}>Durée totale : {formatTotalLabel(total)}</Text>
            <Text style={styles.projectedEnd}>Fin prévue : {formatHour(projectedEnd)}</Text>
          </View>
          <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)}>
            <Text style={styles.qrBtnText}>⬛ QR</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {sections.map((section, si) => (
          <View key={section.id} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <TextInput
                style={styles.sectionNameInput}
                value={section.name}
                onChangeText={t => updateSectionName(si, t)}
                placeholder="Nom de section"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => removeSection(si)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {section.steps.map((step, ti) => (
              <View key={step.id} style={styles.stepRow}>
                <TextInput
                  style={[styles.stepInput, styles.stepNameInput]}
                  value={step.name}
                  onChangeText={t => updateStepName(si, ti, t)}
                  placeholder="Nom de l'étape"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.stepInput, styles.stepDureeInput]}
                  value={String(step.dureeMin)}
                  onChangeText={t => updateStepDuree(si, ti, parseInt(t) || 1)}
                  keyboardType="numeric"
                  placeholder="min"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.minLabel}>min</Text>
                <TouchableOpacity onPress={() => removeStep(si, ti)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addStepBtn}
              onPress={() => addStep(si)}
            >
              <Text style={styles.addStepText}>+ Étape</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection()}>
          <Text style={styles.addSectionText}>+ Section</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => setShowSaveModal(true)}
          >
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>▶ Démarrer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Scan */}
      <QRScanModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        onProtocolScanned={handleQRScanned}
      />

      {/* Modale sauvegarde */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sauvegarder ce protocole</Text>
            <TextInput
              style={styles.modalInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder="Nom du protocole"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleSave}>
                <Text style={styles.modalConfirmText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.copper,
  },
  projectedEnd: {
    ...typography.small,
    marginTop: 2,
  },
  qrBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  qrBtnText: {
    color: colors.text,
    fontSize: 13,
  },
  sectionBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  stepNameInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  stepDureeInput: {
    width: 52,
    textAlign: 'center',
    marginRight: spacing.xs,
  },
  minLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginRight: spacing.sm,
  },
  removeBtn: {
    color: colors.danger,
    fontSize: 16,
    paddingHorizontal: spacing.xs,
  },
  addStepBtn: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addStepText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  addSectionBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  addSectionText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.copper,
    fontSize: 16,
    fontWeight: '600',
  },
  startBtn: {
    flex: 2,
    backgroundColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  modalConfirm: {
    flex: 2,
    backgroundColor: colors.copper,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
