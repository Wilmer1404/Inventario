import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  Trash2,
  Edit2,
  Save,
  Search,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, Trabajador } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

interface SessionBienItem {
  id: number;
  codigo_qr: string;
  nombre: string;
  categoria: string;
  foto_url?: string | null;
  observacion?: string;
}

export default function VincularScreen() {
  const router = useRouter();

  // Trabajador seleccionado
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [bienesSession, setBienesSession] = useState<SessionBienItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Modales
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const [workersList, setWorkersList] = useState<Trabajador[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Cargar trabajador inicial y catálogo inicial
  useEffect(() => {
    apiClient
      .get('/trabajadores')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          const first = res.data.data[0];
          setTrabajador(first);

          apiClient
            .get(`/kits/trabajador/${first.id}`)
            .then((kitRes) => {
              if (kitRes.data.success && kitRes.data.data.bienes?.length > 0) {
                setBienesSession(
                  kitRes.data.data.bienes.map((b: Bien) => ({
                    id: b.id,
                    codigo_qr: b.codigo_qr,
                    nombre: b.nombre,
                    categoria: b.categoria,
                    foto_url: b.foto_url,
                  }))
                );
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const openWorkerSelector = async () => {
    setWorkerModalVisible(true);
    try {
      setLoadingWorkers(true);
      const res = await apiClient.get('/trabajadores', {
        params: { search: workerSearch },
      });
      if (res.data.success) {
        setWorkersList(res.data.data);
      }
    } catch {
      // Manejo de error
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleSelectWorker = async (w: Trabajador) => {
    setTrabajador(w);
    setWorkerModalVisible(false);

    try {
      const res = await apiClient.get(`/kits/trabajador/${w.id}`);
      if (res.data.success && res.data.data.bienes) {
        setBienesSession(
          res.data.data.bienes.map((b: Bien) => ({
            id: b.id,
            codigo_qr: b.codigo_qr,
            nombre: b.nombre,
            categoria: b.categoria,
            foto_url: b.foto_url,
          }))
        );
      } else {
        setBienesSession([]);
      }
    } catch {
      setBienesSession([]);
    }
  };

  const handleAddBienByQr = async () => {
    if (!qrInput.trim()) {
      Alert.alert('Atención', 'Ingrese el código QR del bien.');
      return;
    }

    const code = qrInput.trim();
    if (bienesSession.some((item) => item.codigo_qr.toUpperCase() === code.toUpperCase())) {
      Alert.alert('Aviso', 'Este bien ya se encuentra en la lista actual.');
      return;
    }

    try {
      setLoadingAdd(true);
      const res = await apiClient.get(`/bienes/qr/${encodeURIComponent(code)}`);
      if (res.data.success) {
        const b = res.data.data;
        setBienesSession((prev) => [
          ...prev,
          {
            id: b.id,
            codigo_qr: b.codigo_qr,
            nombre: b.nombre,
            categoria: b.categoria,
            foto_url: b.foto_url,
          },
        ]);
        setQrInput('');
        setAddModalVisible(false);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        Alert.alert(
          'Bien no encontrado',
          `No se encontró ningún bien registrado con el código ${code}.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Registrar Nuevo',
              onPress: () => {
                setAddModalVisible(false);
                router.push({
                  pathname: '/bien/nuevo',
                  params: { qr: code },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Fallo al buscar el bien.');
      }
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveBien = (id: number) => {
    setBienesSession((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGuardarVinculacion = async () => {
    if (!trabajador) {
      Alert.alert('Atención', 'Seleccione un trabajador responsable.');
      return;
    }

    if (bienesSession.length === 0) {
      Alert.alert('Atención', 'Agregue al menos un bien a la sesión antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.post('/kits/vincular', {
        trabajador_id: trabajador.id,
        oficina_id: trabajador.oficina_id,
        bienes_ids: bienesSession.map((b) => b.id),
        motivo: 'Vinculación de kit patrimonial desde aplicación móvil',
      });

      if (res.data.success) {
        Alert.alert(
          '¡Vinculación Exitosa!',
          `Se vincularon ${bienesSession.length} bienes al funcionario ${trabajador.nombre_completo}.`
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error al guardar la vinculación.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={MARCONA_COLORS.slate700} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Vincular Bienes a Responsable</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque Trabajador Municipal Asignado */}
        <Text style={styles.sectionLabel}>Trabajador Municipal Asignado</Text>

        <View style={styles.workerCard}>
          <View style={styles.workerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(trabajador?.nombre_completo)}
              </Text>
            </View>

            <View style={styles.workerTexts}>
              <Text style={styles.workerName} numberOfLines={1}>
                {trabajador?.nombre_completo || 'Seleccionar Trabajador'}
              </Text>
              <Text style={styles.workerRole} numberOfLines={1}>
                {trabajador?.cargo || 'Cargo'} · {trabajador?.oficina?.sigla || 'Oficina'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.changeWorkerBtn}
            onPress={openWorkerSelector}
            activeOpacity={0.8}
          >
            <ArrowLeftRight size={16} color={MARCONA_COLORS.blue} />
          </TouchableOpacity>
        </View>

        {/* Botón Escanear QR para agregar al kit */}
        <TouchableOpacity
          style={styles.dashedAddBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Camera size={18} color={MARCONA_COLORS.red} />
          <Text style={styles.dashedAddBtnText}>
            + Escanear QR para agregar bien al kit
          </Text>
        </TouchableOpacity>

        {/* Encabezado Lista de Bienes */}
        <View style={styles.sessionHeaderRow}>
          <Text style={styles.sessionTitle}>
            Bienes en esta sesión ({bienesSession.length})
          </Text>

          <View style={styles.officeTag}>
            <Text style={styles.officeTagText}>
              Kit {trabajador?.oficina?.sigla ? `[${trabajador.oficina.sigla}]` : 'Municipal'}
            </Text>
          </View>
        </View>

        {/* Lista de Bienes Acumulados */}
        {bienesSession.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No hay bienes agregados para vincular.{'\n'}
              Toca el botón superior para escanear o escribir un código QR.
            </Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {bienesSession.map((item) => (
              <View key={item.id} style={styles.bienItemCard}>
                <BienThumbnail
                  fotoUrl={item.foto_url}
                  categoria={item.categoria}
                  size={44}
                />

                <View style={styles.bienItemTexts}>
                  <Text style={styles.bienItemName} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.bienItemQr}>{item.codigo_qr}</Text>
                </View>

                {/* Acciones */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => router.push(`/bien/${encodeURIComponent(item.codigo_qr)}`)}
                  >
                    <Edit2 size={16} color={MARCONA_COLORS.slate500} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleRemoveBien(item.id)}
                  >
                    <Trash2 size={16} color={MARCONA_COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botón Inferior Fijo de Guardar Vinculación */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleGuardarVinculacion}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color={MARCONA_COLORS.white} />
          ) : (
            <>
              <Save size={18} color={MARCONA_COLORS.white} />
              <Text style={styles.saveBtnText}>
                Guardar Vinculación ({bienesSession.length} bienes)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Buscador de Trabajadores */}
      <Modal
        visible={workerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkerModalVisible(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.workerModalSheet}>
            <View style={styles.workerModalHeader}>
              <Text style={styles.workerModalTitle}>Seleccionar Responsable</Text>
              <TouchableOpacity onPress={() => setWorkerModalVisible(false)}>
                <Text style={styles.workerModalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador de trabajadores */}
            <View style={styles.searchBar}>
              <Search size={16} color={MARCONA_COLORS.slate500} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o DNI..."
                placeholderTextColor={MARCONA_COLORS.slate400}
                value={workerSearch}
                onChangeText={setWorkerSearch}
                onSubmitEditing={openWorkerSelector}
              />
            </View>

            {loadingWorkers ? (
              <ActivityIndicator color={MARCONA_COLORS.red} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView style={styles.workersList} showsVerticalScrollIndicator={false}>
                {workersList.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.workerListItem}
                    onPress={() => handleSelectWorker(w)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.workerListDetails}>
                      <Text style={styles.workerListName}>{w.nombre_completo}</Text>
                      <Text style={styles.workerListDni}>
                        DNI: {w.dni} · {w.cargo}
                      </Text>
                    </View>
                    <Text style={styles.workerListOffice}>{w.oficina?.sigla}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Agregar Bien por QR */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar Bien al Kit</Text>
            <Text style={styles.modalSubtitle}>
              Escribe o escanea el código QR del bien municipal.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: MDM-00142"
              placeholderTextColor={MARCONA_COLORS.slate400}
              value={qrInput}
              onChangeText={setQrInput}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddBienByQr}
                disabled={loadingAdd}
              >
                {loadingAdd ? (
                  <ActivityIndicator color={MARCONA_COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MARCONA_COLORS.slate500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  workerCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MARCONA_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: MARCONA_COLORS.white,
    fontWeight: '900',
    fontSize: 16,
  },
  workerTexts: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  workerRole: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  changeWorkerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MARCONA_COLORS.slate100,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedAddBtn: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: MARCONA_COLORS.red,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dashedAddBtnText: {
    color: MARCONA_COLORS.red,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MARCONA_COLORS.slate800,
  },
  officeTag: {
    backgroundColor: MARCONA_COLORS.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  officeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
  },
  emptyCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate400,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  sessionList: {
    gap: 10,
    marginBottom: 20,
  },
  bienItemCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bienItemTexts: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  bienItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate900,
  },
  bienItemQr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
  },
  bottomBar: {
    backgroundColor: MARCONA_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: MARCONA_COLORS.slate200,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveBtn: {
    backgroundColor: MARCONA_COLORS.red,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
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
  workerModalSheet: {
    backgroundColor: MARCONA_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  workerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  workerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  workerModalClose: {
    fontSize: 14,
    fontWeight: '700',
    color: MARCONA_COLORS.red,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MARCONA_COLORS.slate100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: MARCONA_COLORS.slate900,
  },
  workersList: {
    maxHeight: 300,
  },
  workerListItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workerListDetails: {
    flex: 1,
    paddingRight: 10,
  },
  workerListName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  workerListDni: {
    fontSize: 11,
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  workerListOffice: {
    fontSize: 11,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
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
