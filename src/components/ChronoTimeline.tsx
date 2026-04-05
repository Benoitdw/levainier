import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { ChronoSection } from '../domain/types';
import { colors, spacing, radius } from '../theme';

interface Props {
  sections: ChronoSection[];
  currentSectionIdx: number;
  currentStepIdx: number;
  checkedStepIds: string[];
  elapsedSeconds: number;
  totalSeconds: number;
}

export function ChronoTimeline({
  sections,
  currentSectionIdx,
  currentStepIdx,
  checkedStepIds,
  elapsedSeconds,
  totalSeconds,
}: Props) {
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  return (
    <View style={styles.container}>
      {/* Barre globale */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, progress * 100)}%` }]} />

        {/* Marqueurs de sections */}
        {sections.map((section, si) => {
          const sectionStart = sections
            .slice(0, si)
            .reduce((sum, s) => sum + s.steps.reduce((a, st) => a + st.dureeMin * 60, 0), 0);
          const sectionPos = totalSeconds > 0 ? sectionStart / totalSeconds : 0;

          return (
            <View
              key={section.id}
              style={[styles.sectionMarker, { left: `${sectionPos * 100}%` }]}
            />
          );
        })}
      </View>

      {/* Labels sections */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labels}>
        {sections.map((section, si) => {
          const isDone = si < currentSectionIdx;
          const isActive = si === currentSectionIdx;
          return (
            <View key={section.id} style={styles.sectionLabel}>
              <Text
                style={[
                  styles.sectionName,
                  isDone && styles.sectionDone,
                  isActive && styles.sectionActive,
                ]}
                numberOfLines={1}
              >
                {section.name.toUpperCase()}
              </Text>
              {/* Étapes de la section active */}
              {isActive && (
                <View style={styles.steps}>
                  {section.steps.map((step, ti) => {
                    const isStepActive = ti === currentStepIdx;
                    const isStepDone = ti < currentStepIdx;
                    const isChecked = checkedStepIds.includes(step.id);
                    return (
                      <View
                        key={step.id}
                        style={[
                          styles.stepDot,
                          isStepDone && styles.stepDotDone,
                          isStepActive && styles.stepDotActive,
                          isChecked && styles.stepDotChecked,
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  track: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.copper,
    borderRadius: radius.full,
  },
  sectionMarker: {
    position: 'absolute',
    top: -1,
    width: 2,
    height: 8,
    backgroundColor: colors.paper,
    opacity: 0.6,
  },
  labels: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    marginRight: spacing.lg,
  },
  sectionName: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sectionDone: {
    color: colors.fern,
  },
  sectionActive: {
    color: colors.copper,
  },
  steps: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  stepDotDone: {
    backgroundColor: colors.copper,
    borderColor: colors.copper,
  },
  stepDotActive: {
    width: 12,
    height: 12,
    backgroundColor: colors.copper,
    borderColor: colors.copperLight,
    borderWidth: 2,
    marginTop: -2,
  },
  stepDotChecked: {
    backgroundColor: colors.fern,
    borderColor: colors.fern,
  },
});
