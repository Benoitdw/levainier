import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ChronoStep } from '../domain/types';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  step: ChronoStep;
  isActive: boolean;
  isChecked: boolean;
  onCheck: () => void;
  onSkip: () => void;
}

export function StepCard({ step, isActive, isChecked, onCheck, onSkip }: Props) {
  return (
    <View style={[styles.card, isActive && styles.cardActive, isChecked && styles.cardChecked]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onCheck} style={styles.checkBtn}>
          <Text style={[styles.checkIcon, isChecked && styles.checkIconDone]}>
            {isChecked ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
        <View style={styles.info}>
          <Text style={[styles.name, isChecked && styles.nameChecked]}>{step.name}</Text>
          <Text style={styles.duration}>{step.dureeMin} min</Text>
        </View>
        {isActive && (
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.copper,
    backgroundColor: colors.surface2,
  },
  cardChecked: {
    borderColor: colors.fern,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtn: {
    width: 32,
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  checkIconDone: {
    color: colors.fern,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    ...typography.body,
  },
  nameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  duration: {
    ...typography.small,
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.copper,
  },
  skipText: {
    color: colors.copper,
    fontSize: 13,
  },
});
