import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import type { ChronoSection } from '../domain/types';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  visible: boolean;
  currentSection: ChronoSection;
  nextSection: ChronoSection | null;
  onValidate: () => void;
}

export function SectionGate({ visible, currentSection, nextSection, onValidate }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏸</Text>
          <Text style={styles.title}>{currentSection.name} terminée</Text>
          <Text style={styles.subtitle}>
            Vérifiez la pâte avant de continuer.
          </Text>
          {nextSection && (
            <Text style={styles.next}>Prochaine étape : {nextSection.name}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={onValidate}>
            <Text style={styles.buttonText}>
              Valider → {nextSection?.name ?? 'Terminer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.copper,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.copper,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  next: {
    ...typography.small,
    color: colors.fern,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
