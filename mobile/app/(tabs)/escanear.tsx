import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  X,
  Zap,
  ZapOff,
  QrCode,
  Keyboard,
  Camera,
  CheckCircle2,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { CampanaInventario } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

export default function EscanearScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<'consulta' | 'rapido'>(
    params.mode === 'rapido' ? 'rapido' : 'consulta'
  );
  const [torch, setTorch] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('MDM-00142');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [campana, setCampana] = useState<CampanaInventario | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const cooldownRef = useRef(false);

  useEffect(() => {
    if (params.mode === 'rapido') {
      setMode('rapido');
    }
  }, [params.mode]);

  useEffect(() => {
    apiClient
      .get('/campanas/activa')
      .then((res) => {
        if (res.data.success) {
          setCampana(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const processCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || cooldownRef.current || processing) return;

    cooldownRef.current = true;
    setLastScannedCode(code);
    setProcessing(true);

    try {
      if (mode === 'consulta') {
        // Modo Consulta / Registro
        try {
          const res = await apiClient.get(`/bienes/qr/${encodeURIComponent(code)}`);
          if (res.data.success) {
            router.push(`/bien/${encodeURIComponent(code)}`);
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
            router.push({
              pathname: '/bien/nuevo',
              params: { qr: code },
            });
          } else {
            Alert.alert('Error', 'No se pudo consultar el bien.');
          }
        }
      } else {
        // Modo Inventario Rápido
        try {
          const bienRes = await apiClient.get(`/bienes/qr/${encodeURIComponent(code)}`);
          if (bienRes.data.success) {
            const bien = bienRes.data.data;
            const campanaId = campana?.id || 1;

            await apiClient.post('/verificaciones', {
              campana_id: campanaId,
              bien_id: bien.id,
              estado_verificado: 'CONFORME',
              observacion: 'Verificación en modo escaneo rápido',
            });

            setSuccessBanner(`¡Bien ${code} verificado con éxito!`);
            setTimeout(() => setSuccessBanner(null), 2500);
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
            Alert.alert(
              'No Registrado',
              `El bien con código ${code} no existe en el catálogo. ¿Desea registrarlo?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Registrar',
                  onPress: () =>
                    router.push({
                      pathname: '/bien/nuevo',
                      params: { qr: code },
                    }),
                },
              ]
            );
          } else {
            Alert.alert('Error', 'Fallo al verificar el bien.');
          }
        }
      }
    } finally {
      setProcessing(false);
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2000);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    processCode(data);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Atención', 'Ingrese un código válido.');
      return;
    }
    const code = manualCode.trim();
    setManualModalVisible(false);
    setManualCode('');
    processCode(code);
  };

  return (
    <View style={styles.container}>
      {/* Vista de Cámara o Solicitud de Permisos */}
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13'],
          }}
          onBarcodeScanned={cooldownRef.current ? undefined : handleBarCodeScanned}
        />
      ) : (
        <View style={styles.permissionBox}>
          <Camera size={52} color={MARCONA_COLORS.slate400} />
          <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
          <Text style={styles.permissionText}>
            Se requiere acceso a la cámara para escanear etiquetas QR y códigos de barras de los bienes.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionBtnText}>Habilitar Cámara</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controles Flotantes Superiores */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topBar}>
          {/* Botón Salir / Reset */}
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <X size={20} color={MARCONA_COLORS.white} />
          </TouchableOpacity>

          {/* Pill Central con Nombre de Campaña */}
          <View style={styles.campanaPill}>
            <Text style={styles.campanaPillText}>
              {campana?.nombre || 'Inventario 2026'}
            </Text>
          </View>

          {/* Botón Linterna */}
          <TouchableOpacity
            style={[
              styles.circleBtn,
              torch && { backgroundColor: MARCONA_COLORS.gold, borderColor: '#FDE68A' },
            ]}
            onPress={() => setTorch(!torch)}
            activeOpacity={0.8}
          >
            {torch ? (
              <ZapOff size={18} color={MARCONA_COLORS.white} />
            ) : (
              <Zap size={18} color={MARCONA_COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle Segmentado: Consulta / Registro vs Inventario Rápido */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'consulta' && styles.toggleBtnActive,
              ]}
              onPress={() => setMode('consulta')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  mode === 'consulta' && styles.toggleBtnTextActive,
                ]}
              >
                Consulta / Registro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                mode === 'rapido' && styles.toggleBtnActive,
              ]}
              onPress={() => setMode('rapido')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  mode === 'rapido' && styles.toggleBtnTextActive,
                ]}
              >
                Inventario Rápido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Banner de Verificación Exitosa en Modo Rápido */}
      {successBanner && (
        <View style={styles.successBanner}>
          <CheckCircle2 size={18} color={MARCONA_COLORS.white} />
          <Text style={styles.successBannerText}>{successBanner}</Text>
        </View>
      )}

      {/* Visor Central */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <View style={styles.viewfinder}>
          {/* Esquinas Estilizadas Dorado y Blanco */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: MARCONA_COLORS.gold }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: MARCONA_COLORS.white }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: MARCONA_COLORS.white }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: MARCONA_COLORS.gold }]} />

          {/* Línea Central Dorada */}
          <View style={styles.scanLine} />
        </View>

        {/* Chip con Código Detectado */}
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>
            {processing ? 'Consultando...' : lastScannedCode}
          </Text>
        </View>

        {/* Botón Ingresar Código Manual */}
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.85}
        >
          <Keyboard size={15} color={MARCONA_COLORS.slate300} />
          <Text style={styles.manualBtnText}>Ingresar código manual</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta Inferior Estilo Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetContent}>
          <View style={styles.sheetIconBox}>
            <QrCode size={24} color={MARCONA_COLORS.red} />
          </View>
          <View style={styles.sheetTextBox}>
            <Text style={styles.sheetTitle}>
              Modo: {mode === 'consulta' ? 'Consulta / Registro' : 'Inventario Rápido'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              Apunta al código QR o código de barras del bien municipal
            </Text>
          </View>
        </View>
      </View>

      {/* Modal para Ingreso Manual de Código */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ingreso Manual de Código</Text>
            <Text style={styles.modalSubtitle}>
              Escribe el código QR (ej: MDM-00142) para buscar o inventariar.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="MDM-00142"
              placeholderTextColor={MARCONA_COLORS.slate400}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setManualModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleManualSubmit}
              >
                <Text style={styles.modalSubmitText}>Procesar</Text>
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
    backgroundColor: MARCONA_COLORS.slate950,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: MARCONA_COLORS.slate900,
  },
  permissionTitle: {
    color: MARCONA_COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: MARCONA_COLORS.slate400,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    maxWidth: 280,
  },
  permissionBtn: {
    backgroundColor: MARCONA_COLORS.red,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: MARCONA_COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  topOverlay: {
    zIndex: 10,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campanaPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate700,
  },
  campanaPillText: {
    color: MARCONA_COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRow: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  toggleContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    padding: 4,
    borderRadius: 999,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate800,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: MARCONA_COLORS.red,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.slate400,
  },
  toggleBtnTextActive: {
    color: MARCONA_COLORS.white,
  },
  successBanner: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    zIndex: 25,
    backgroundColor: MARCONA_COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  successBannerText: {
    color: MARCONA_COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  viewfinder: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    width: '85%',
    height: 2,
    backgroundColor: MARCONA_COLORS.gold,
    ...Platform.select({
      ios: {
        shadowColor: MARCONA_COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  codeChip: {
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 22,
  },
  codeChipText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.gold,
  },
  manualBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate700,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  manualBtnText: {
    color: MARCONA_COLORS.slate200,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSheet: {
    backgroundColor: MARCONA_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: MARCONA_COLORS.slate300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetTextBox: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: MARCONA_COLORS.slate100,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: MARCONA_COLORS.slate900,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: MARCONA_COLORS.slate100,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: MARCONA_COLORS.slate600,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: MARCONA_COLORS.red,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: MARCONA_COLORS.white,
  },
});
