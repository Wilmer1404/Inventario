import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
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
            // Bien no existe -> Navegar a Registro Rápido
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
      // Cooldown de 2 segundos para evitar re-escaneo accidental
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
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />

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
        <View className="flex-1 items-center justify-center p-6 bg-slate-900">
          <Camera size={52} color="#94A3B8" />
          <Text className="text-white text-lg font-bold mt-4 text-center">
            Permiso de Cámara
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-2 mb-5">
            Se requiere acceso a la cámara para escanear etiquetas QR y códigos de barras de los bienes.
          </Text>
          <TouchableOpacity
            className="bg-red-700 px-6 py-3 rounded-xl active:opacity-90"
            onPress={requestPermission}
          >
            <Text className="text-white font-bold text-sm">Habilitar Cámara</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controles Flotantes Superiores */}
      <SafeAreaView className="z-10">
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          {/* Botón Salir / Reset */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-slate-900/80 items-center justify-center border border-slate-700"
            onPress={() => router.push('/(tabs)')}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pill Central con Nombre de Campaña */}
          <View className="bg-slate-900/90 px-4 py-1.5 rounded-full border border-slate-700">
            <Text className="text-white text-xs font-bold">
              {campana?.nombre || 'Inventario 2026'}
            </Text>
          </View>

          {/* Botón Linterna */}
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center border ${
              torch
                ? 'bg-amber-500 border-amber-300'
                : 'bg-slate-900/80 border-slate-700'
            }`}
            onPress={() => setTorch(!torch)}
          >
            {torch ? (
              <ZapOff size={18} color="#FFFFFF" />
            ) : (
              <Zap size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle Segmentado: Consulta / Registro vs Inventario Rápido */}
        <View className="px-5 mt-2">
          <View className="bg-slate-900/90 p-1 rounded-full flex-row border border-slate-800">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${
                mode === 'consulta' ? 'bg-red-700 shadow-sm' : ''
              }`}
              onPress={() => setMode('consulta')}
            >
              <Text
                className={`text-xs font-bold ${
                  mode === 'consulta' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Consulta / Registro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${
                mode === 'rapido' ? 'bg-red-700 shadow-sm' : ''
              }`}
              onPress={() => setMode('rapido')}
            >
              <Text
                className={`text-xs font-bold ${
                  mode === 'rapido' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Inventario Rápido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Banner de Verificación Exitosa en Modo Rápido */}
      {successBanner && (
        <View className="absolute top-36 left-5 right-5 z-20 bg-green-700 px-4 py-3 rounded-2xl flex-row items-center justify-center shadow-lg">
          <CheckCircle2 size={18} color="#FFFFFF" />
          <Text className="text-white font-bold text-xs ml-2">
            {successBanner}
          </Text>
        </View>
      )}

      {/* Visor Central */}
      <View className="flex-1 items-center justify-center -mt-10">
        <View style={styles.viewfinder}>
          {/* Esquinas Estilizadas Dorado y Blanco */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: '#D97706' }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: '#FFFFFF' }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: '#FFFFFF' }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: '#D97706' }]} />

          {/* Línea Central Dorada */}
          <View style={styles.scanLine} />
        </View>

        {/* Chip con Código Detectado */}
        <View className="bg-slate-950/80 border border-amber-600/80 px-4 py-1.5 rounded-full mt-6 shadow-sm">
          <Text className="font-mono text-xs font-bold text-amber-500">
            {processing ? 'Consultando...' : lastScannedCode}
          </Text>
        </View>

        {/* Botón Ingresar Código Manual */}
        <TouchableOpacity
          className="bg-slate-900/80 border border-slate-700 px-4 py-2.5 rounded-full flex-row items-center mt-3 active:opacity-90 shadow-sm"
          onPress={() => setManualModalVisible(true)}
        >
          <Keyboard size={15} color="#CBD5E1" />
          <Text className="text-slate-200 text-xs font-bold ml-2">
            Ingresar código manual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta Inferior Estilo Bottom Sheet */}
      <View className="bg-white rounded-t-3xl p-5 shadow-2xl">
        <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-4" />

        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-2xl bg-red-100 items-center justify-center mr-3.5">
            <QrCode size={24} color="#B91C1C" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-slate-900">
              Modo: {mode === 'consulta' ? 'Consulta / Registro' : 'Inventario Rápido'}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
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
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-base font-bold text-slate-800 mb-1">
              Ingreso Manual de Código
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Escribe el código QR (ej: MARCONA-EQ-001) para buscar o inventariar.
            </Text>

            <TextInput
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-3 text-slate-800 font-mono text-sm mb-5"
              placeholder="MARCONA-EQ-001"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
            />

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
                onPress={() => setManualModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 bg-red-700 rounded-xl items-center"
                onPress={handleManualSubmit}
              >
                <Text className="text-white font-bold text-sm">Procesar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
