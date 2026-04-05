import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimerStore, BUNDLED_PRESETS } from '../store/timerStore';
import type { SavedPreset, ChronoPreset } from '../domain/types';
import { formatTotalLabel, computeTotalSeconds } from '../domain/timerEngine';
import { colors, spacing, radius, typography } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { phase, timer, customPresets, loadPreset, setSections } = useTimerStore();

  function handleSelectPreset(preset: ChronoPreset) {
    loadPreset(preset);
    navigation.navigate('Config');
  }

  function handleSelectCustom(saved: SavedPreset) {
    setSections(saved.sections);
    navigation.navigate('Config');
  }

  function handleNewProtocol() {
    navigation.navigate('Config');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.appTitle}>Levainier</Text>
        <Text style={styles.appSubtitle}>Minuteur boulangerie</Text>

        {/* Bannière timer actif */}
        {phase === 'active' && timer && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => navigation.navigate('Active')}
          >
            <Text style={styles.activeBannerLabel}>▶ Timer en cours</Text>
            <Text style={styles.activeBannerSection}>
              {timer.sections[timer.currentSectionIdx]?.name}
              {' — '}
              {timer.sections[timer.currentSectionIdx]?.steps[timer.currentStepIdx]?.name}
            </Text>
          </TouchableOpacity>
        )}

        {/* Mes protocoles (custom) */}
        {customPresets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes protocoles</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SavedPresets')}
              >
                <Text style={styles.sectionLink}>Gérer →</Text>
              </TouchableOpacity>
            </View>
            {customPresets.map(p => (
              <PresetCard
                key={p.id}
                label={p.label}
                sections={p.sections}
                badge="Perso"
                onPress={() => handleSelectCustom(p)}
              />
            ))}
          </View>
        )}

        {/* Protocoles inclus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protocoles inclus</Text>
          {BUNDLED_PRESETS.map(p => (
            <PresetCard
              key={p.id}
              label={p.label}
              sections={p.sections}
              onPress={() => handleSelectPreset(p)}
            />
          ))}
        </View>

        {/* Nouveau protocole */}
        <TouchableOpacity style={styles.newBtn} onPress={handleNewProtocol}>
          <Text style={styles.newBtnText}>+ Nouveau protocole</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PresetCard({
  label, sections, badge, onPress,
}: {
  label: string;
  sections: any[];
  badge?: string;
  onPress: () => void;
}) {
  const total = computeTotalSeconds(sections);
  const sectionNames = sections.map(s => s.name).join(' · ');
  return (
    <TouchableOpacity style={styles.presetCard} onPress={onPress}>
      <View style={styles.presetRow}>
        <View style={styles.presetInfo}>
          <Text style={styles.presetLabel}>{label}</Text>
          <Text style={styles.presetMeta}>{sectionNames}</Text>
        </View>
        <View style={styles.presetRight}>
          {badge && <Text style={styles.badge}>{badge}</Text>}
          <Text style={styles.presetDuration}>{formatTotalLabel(total)}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.copper,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    ...typography.small,
    marginBottom: spacing.xl,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeBanner: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.copper,
  },
  activeBannerLabel: {
    color: colors.copper,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  activeBannerSection: {
    color: colors.text,
    fontSize: 15,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionLink: {
    color: colors.copper,
    fontSize: 13,
  },
  presetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  presetMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  presetRight: {
    alignItems: 'flex-end',
  },
  badge: {
    fontSize: 11,
    color: colors.copper,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  presetDuration: {
    fontSize: 14,
    color: colors.textMuted,
  },
  newBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  newBtnText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
