import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, QrCode, PlusCircle, Building, User, ChevronDown } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { Oficina, Trabajador, EstadoConservacion } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

export default function NuevoBienScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qr?: string }>();

  const [codigoQr, setCodigoQr] = useState(params.qr || '');
  const [codigoPatrimonial, setCodigoPatrimonial] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Equipos de Cómputo');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [estadoConservacion] = useState<EstadoConservacion>('BUENO');

  // Relaciones
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [oficinaModalVisible, setOficinaModalVisible] = useState(false);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
  const [trabajadorModalVisible, setTrabajadorModalVisible] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/oficinas'),
      apiClient.get('/trabajadores'),
    ])
      .then(([ofRes, trabRes]) => {
        if (ofRes.data.success && ofRes.data.data.length > 0) {
          setOficinas(ofRes.data.data);
          setSelectedOficina(ofRes.data.data[0]);
        }
        if (trabRes.data.success) {
          setTrabajadores(trabRes.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleRegistrarBien = async () => {
    if (!codigoQr.trim() || !nombre.trim() || !marca.trim() || !modelo.trim() || !selectedOficina) {
      Alert.alert('Atención', 'Por favor complete el código QR, nombre, marca, modelo y oficina.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.post('/bienes', {
        codigo_qr: codigoQr.trim(),
        codigo_patrimonial: codigoPatrimonial.trim() || null,
        tipo_gestion: 'ACTIVO_UNICO',
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        numero_serie: numeroSerie.trim() || null,
        estado_conservacion: estadoConservacion,
        oficina_id: selectedOficina.id,
        trabajador_id: selectedTrabajador?.id || null,
        observaciones: 'Registrado desde la app móvil',
      });

      if (res.data.success) {
        Alert.alert('¡Bien Registrado!', 'El activo patrimonial fue creado exitosamente.', [
          {
            text: 'Ver Ficha',
            onPress: () => router.replace(`/bien/${encodeURIComponent(codigoQr.trim())}`),
          },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error al registrar el bien.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={MARCONA_COLORS.slate700} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Registrar Nuevo Bien</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Código QR */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código QR / Etiqueta *</Text>
            <View style={styles.qrInputBox}>
              <QrCode size={18} color={MARCONA_COLORS.blue} />
              <TextInput
                style={styles.qrInput}
                placeholder="MDM-00150"
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={codigoQr}
                onChangeText={setCodigoQr}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Nombre del Bien */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción o Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Laptop HP ProBook 450 G9"
              placeholderTextColor={MARCONA_COLORS.slate400}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          {/* Código Patrimonial SBN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Patrimonial SBN (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 740877000120"
              placeholderTextColor={MARCONA_COLORS.slate400}
              value={codigoPatrimonial}
              onChangeText={setCodigoPatrimonial}
            />
          </View>

          {/* Categoría y Marca */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                placeholder="Cómputo"
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={categoria}
                onChangeText={setCategoria}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Marca *</Text>
              <TextInput
                style={styles.input}
                placeholder="HP, Lenovo..."
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={marca}
                onChangeText={setMarca}
              />
            </View>
          </View>

          {/* Modelo y N° Serie */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Modelo *</Text>
              <TextInput
                style={styles.input}
                placeholder="ProBook 450..."
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={modelo}
                onChangeText={setModelo}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>N.º de Serie</Text>
              <TextInput
                style={[styles.input, styles.monoText]}
                placeholder="5CD2348KLM"
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={numeroSerie}
                onChangeText={setNumeroSerie}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Selector de Oficina */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Oficina de Asignación *</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setOficinaModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.selectorLeft}>
                <Building size={16} color={MARCONA_COLORS.slate500} />
                <Text style={styles.selectorText} numberOfLines={1}>
                  {selectedOficina ? selectedOficina.nombre : 'Seleccionar Oficina'}
                </Text>
              </View>
              <ChevronDown size={16} color={MARCONA_COLORS.slate500} />
            </TouchableOpacity>
          </View>

          {/* Selector de Trabajador */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Responsable / Custodio (Opcional)</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setTrabajadorModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.selectorLeft}>
                <User size={16} color={MARCONA_COLORS.slate500} />
                <Text style={styles.selectorText} numberOfLines={1}>
                  {selectedTrabajador ? selectedTrabajador.nombre_completo : 'Sin asignar (disponible)'}
                </Text>
              </View>
              <ChevronDown size={16} color={MARCONA_COLORS.slate500} />
            </TouchableOpacity>
          </View>

          {/* Botón Registrar */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegistrarBien}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color={MARCONA_COLORS.white} />
            ) : (
              <>
                <PlusCircle size={18} color={MARCONA_COLORS.white} />
                <Text style={styles.submitBtnText}>Registrar Bien</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Oficina */}
      <Modal visible={oficinaModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Seleccionar Oficina</Text>
            <ScrollView style={styles.modalScroll}>
              {oficinas.map((of) => (
                <TouchableOpacity
                  key={of.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedOficina(of);
                    setOficinaModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{of.nombre}</Text>
                  <Text style={styles.modalItemSigla}>{of.sigla}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Trabajador */}
      <Modal visible={trabajadorModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Seleccionar Responsable</Text>
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedTrabajador(null);
                  setTrabajadorModalVisible(false);
                }}
              >
                <Text style={styles.modalItemUnassigned}>Dejar sin asignar</Text>
              </TouchableOpacity>
              {trabajadores.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTrabajador(t);
                    setTrabajadorModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{t.nombre_completo}</Text>
                  <Text style={styles.modalItemSubtitle}>{t.cargo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MARCONA_COLORS.slate50,
  },
  header: {
    backgroundColor: MARCONA_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MARCONA_COLORS.slate100,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: MARCONA_COLORS.slate700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  qrInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MARCONA_COLORS.blueLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qrInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
  },
  input: {
    backgroundColor: MARCONA_COLORS.slate50,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: MARCONA_COLORS.slate900,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  selectorBtn: {
    backgroundColor: MARCONA_COLORS.slate50,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: MARCONA_COLORS.slate800,
    marginLeft: 8,
  },
  submitBtn: {
    backgroundColor: MARCONA_COLORS.red,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: MARCONA_COLORS.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnText: {
    color: MARCONA_COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: MARCONA_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    marginBottom: 14,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  modalItemSigla: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
  },
  modalItemSubtitle: {
    fontSize: 11,
    color: MARCONA_COLORS.slate400,
  },
  modalItemUnassigned: {
    fontSize: 13,
    fontWeight: '600',
    color: MARCONA_COLORS.slate500,
  },
});
