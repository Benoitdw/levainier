import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, Alert, StyleSheet,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimerStore } from '../store/timerStore';
import { colors, spacing, radius, typography } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Done'>;
};

export function DoneScreen({ navigation }: Props) {
  const { timer, resetTimer, saveCustomPreset } = useTimerStore();
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');

  function handleSave() {
    const name = saveName.trim();
    if (!name) {
      Alert.alert('Nom requis');
      return;
    }
    saveCustomPreset(name);
    setShowSave(false);
    setSaveName('');
    Alert.alert('Sauvegardé !', `"${name}" ajouté à vos protocoles.`);
  }

  function handleBack() {
    resetTimer();
    navigation.replace('Home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍞</Text>
      <Text style={styles.title}>Bonne fournée !</Text>
      <Text style={styles.subtitle}>
        Profitez de votre pain.
      </Text>

      <TouchableOpacity style={styles.saveBtn} onPress={() => setShowSave(true)}>
        <Text style={styles.saveBtnText}>Sauvegarder ce protocole</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeBtn} onPress={handleBack}>
        <Text style={styles.homeBtnText}>← Retour à l'accueil</Text>
      </TouchableOpacity>

      <Modal visible={showSave} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Sauvegarder ce protocole</Text>
            <TextInput
              style={styles.input}
              value={saveName}
              onChangeText={setSaveName}
              placeholder="Nom du protocole"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowSave(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
                <Text style={styles.confirmText}>Sauvegarder</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.copper,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  saveBtnText: {
    color: colors.copper,
    fontSize: 15,
    fontWeight: '600',
  },
  homeBtn: {
    padding: spacing.md,
  },
  homeBtnText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
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
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    padding: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  confirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
