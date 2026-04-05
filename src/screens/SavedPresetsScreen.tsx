import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal,
  TextInput, Share, StyleSheet,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTimerStore } from '../store/timerStore';
import type { SavedPreset, ChronoSection } from '../domain/types';
import { buildShareUrl, serializePreset, slugify } from '../domain/protocol';
import { computeTotalSeconds, formatTotalLabel } from '../domain/timerEngine';
import { colors, spacing, radius, typography } from '../theme';
import { QRScanModal } from '../components/QRScanModal';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SavedPresets'>;
};

export function SavedPresetsScreen({ navigation }: Props) {
  const { customPresets, deleteCustomPreset, updateCustomPreset, setSections } = useTimerStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [showQR, setShowQR] = useState(false);

  function handleQRScanned(sections: ChronoSection[]) {
    setSections(sections);
    navigation.navigate('Config');
  }

  function handleEdit(preset: SavedPreset) {
    setEditingId(preset.id);
    setEditLabel(preset.label);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const preset = customPresets.find(p => p.id === editingId)!;
    updateCustomPreset(editingId, editLabel.trim() || preset.label, preset.sections);
    setEditingId(null);
  }

  function handleDelete(preset: SavedPreset) {
    Alert.alert(
      'Supprimer ce protocole ?',
      `"${preset.label}" sera supprimé définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteCustomPreset(preset.id),
        },
      ]
    );
  }

  async function handleShareLink(preset: SavedPreset) {
    const url = buildShareUrl(preset.label, preset.sections);
    await Share.share({
      message: `Protocole "${preset.label}" sur Levainier : ${url}`,
      url,
    });
  }

  async function handleShareJson(preset: SavedPreset) {
    const json = serializePreset(preset.label, preset.sections);
    const filename = `${slugify(preset.label) || 'protocole'}.json`;
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: `Partager "${preset.label}"`,
    });
  }

  function handleLoad(preset: SavedPreset) {
    setSections(preset.sections);
    navigation.navigate('Config');
  }

  if (customPresets.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Aucun protocole sauvegardé</Text>
        <Text style={styles.emptyText}>
          Créez un protocole dans la configuration et appuyez sur "Sauvegarder".
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {customPresets.map(preset => (
          <View key={preset.id} style={styles.card}>
            {/* Nom + durée */}
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{preset.label}</Text>
                <Text style={styles.cardMeta}>
                  {formatTotalLabel(computeTotalSeconds(preset.sections))}
                  {' · '}
                  {preset.sections.length} section{preset.sections.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Sections */}
            <Text style={styles.sectionsList}>
              {preset.sections.map(s => s.name).join(' → ')}
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleLoad(preset)}>
                <Text style={styles.actionText}>Charger</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(preset)}>
                <Text style={styles.actionText}>Renommer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleShareLink(preset)}>
                <Text style={styles.actionText}>Lien</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleShareJson(preset)}>
                <Text style={styles.actionText}>JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(preset)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bouton scan QR flottant */}
      <TouchableOpacity style={styles.qrFab} onPress={() => setShowQR(true)}>
        <Text style={styles.qrFabText}>⬛ Scanner</Text>
      </TouchableOpacity>

      <QRScanModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        onProtocolScanned={handleQRScanned}
      />

      {/* Modale renommage */}
      <Modal visible={!!editingId} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Renommer le protocole</Text>
            <TextInput
              style={styles.modalInput}
              value={editLabel}
              onChangeText={setEditLabel}
              autoFocus
              placeholder="Nom"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingId(null)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveEdit}>
                <Text style={styles.confirmText}>OK</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    ...typography.small,
    marginTop: 2,
  },
  sectionsList: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 18,
    paddingHorizontal: spacing.xs,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  overlay: {
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
  qrFab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.copper,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  qrFabText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
