import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, spacing, radius, typography } from '../theme';
import { decodeQRPayload } from '../domain/protocol';
import type { ChronoSection } from '../domain/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onProtocolScanned: (sections: ChronoSection[]) => void;
}

export function QRScanModal({ visible, onClose, onProtocolScanned }: Props) {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    try {
      const url = new URL(data);
      const encoded = url.searchParams.get('p');
      if (encoded) {
        const sections = decodeQRPayload(encoded);
        if (sections) {
          onProtocolScanned(sections);
          onClose();
          return;
        }
      }
    } catch { /* pas une URL valide */ }

    Alert.alert('QR invalide', 'Ce QR code ne contient pas un protocole Levainier.');
    setScanned(false);
  }

  function handleClose() {
    setScanned(false);
    onClose();
  }

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centered}>
          <Text style={styles.text}>Chargement…</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centered}>
          <Text style={styles.title}>Accès à la caméra requis</Text>
          <Text style={styles.text}>Pour scanner un QR code, l'app a besoin de la caméra.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.hint}>
            {scanned ? 'Lecture…' : 'Pointez vers un QR code Levainier'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeText}>✕ Fermer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: colors.copper,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  hint: {
    color: colors.white,
    marginTop: spacing.lg,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  closeText: {
    color: colors.white,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.copper,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    padding: spacing.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
