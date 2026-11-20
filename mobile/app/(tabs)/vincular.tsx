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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  Trash2,
  Edit2,
  Save,
  Search,
  CheckCircle2,
  User,
  Building,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, Trabajador } from '../../src/types';

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

          // Cargar bienes iniciales si existen
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

    // Cargar bienes asignados al nuevo trabajador seleccionado
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
      }
    } catch {
      // Ignorar si no tiene bienes
    }
  };

  const handleAddBienByQr = async () => {
    const code = qrInput.trim();
    if (!code) {
      Alert.alert('Atención', 'Ingrese el código QR del bien.');
      return;
    }

    if (bienesSession.some((b) => b.codigo_qr.toUpperCase() === code.toUpperCase())) {
      Alert.alert('Atención', 'Este bien ya se encuentra en la lista de vinculación.');
      return;
    }

    try {
      setLoadingAdd(true);
      const res = await apiClient.get(`/bienes/qr/${encodeURIComponent(code)}`);
      if (res.data.success) {
        const bien: Bien = res.data.data;
        setBienesSession((prev) => [
          ...prev,
          {
            id: bien.id,
            codigo_qr: bien.codigo_qr,
            nombre: bien.nombre,
            categoria: bien.categoria,
            foto_url: bien.foto_url,
          },
        ]);
        setQrInput('');
        setAddModalVisible(false);
      }
    } catch (err: any) {
      Alert.alert(
        'No encontrado',
        err.response?.data?.message || `No se encontró el bien con código ${code}`
      );
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveBien = (id: number) => {
    setBienesSession((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGuardarVinculacion = async () => {
    if (!trabajador) {
      Alert.alert('Atención', 'Seleccione un trabajador responsable.');
      return;
    }

    if (bienesSession.length === 0) {
      Alert.alert('Atención', 'Agregue al menos un bien para vincular al trabajador.');
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.post('/kits/vincular', {
        trabajador_id: trabajador.id,
        bienes_ids: bienesSession.map((b) => b.id),
        motivo: `Vinculación de Kit para ${trabajador.nombre_completo}`,
      });

      if (res.data.success) {
        Alert.alert(
          '¡Vinculación Guardada!',
          `Se asignaron exitosamente ${res.data.data.total_vinculados} bienes a ${trabajador.nombre_completo}.`
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error al guardar la vinculación.');
    } finally {
      setSaving(false);
    }
  };

  // Iniciales del trabajador para el avatar
  const getInitials = (name?: string) => {
    if (!name) return 'TM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header Superior */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center shadow-2xs">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200 mr-3"
          onPress={() => router.push('/(tabs)')}
        >
          <ArrowLeft size={20} color="#334155" />
        </TouchableOpacity>

        <Text className="text-base font-extrabold text-slate-900">
          Vincular Bienes a Responsable
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Bloque Trabajador Municipal Asignado */}
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
          Trabajador Municipal Asignado
        </Text>

        <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="w-12 h-12 rounded-full bg-blue-900 items-center justify-center mr-3">
              <Text className="text-white font-extrabold text-base">
                {getInitials(trabajador?.nombre_completo)}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900 leading-tight" numberOfLines={1}>
                {trabajador?.nombre_completo || 'Seleccionar Trabajador'}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                {trabajador?.cargo || 'Cargo'} · {trabajador?.oficina?.sigla || 'Oficina'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200 active:opacity-80"
            onPress={openWorkerSelector}
          >
            <ArrowLeftRight size={16} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* Botón Escanear QR para agregar al kit */}
        <TouchableOpacity
          className="border-dashed border-2 border-red-700 bg-red-50/80 py-3.5 px-4 rounded-2xl items-center flex-row justify-center mb-5 active:opacity-90"
          onPress={() => setAddModalVisible(true)}
        >
          <Camera size={18} color="#B91C1C" />
          <Text className="text-red-700 font-bold text-sm ml-2">
            + Escanear QR para agregar bien al kit
          </Text>
        </TouchableOpacity>

        {/* Encabezado Lista de Bienes */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-sm font-extrabold text-slate-800">
            Bienes en esta sesión ({bienesSession.length})
          </Text>
          <View className="bg-blue-100/80 px-2.5 py-0.5 rounded-md">
            <Text className="text-[11px] font-bold text-blue-900">
              Kit {trabajador?.oficina?.sigla ? `[${trabajador.oficina.sigla}]` : 'Municipal'}
            </Text>
          </View>
        </View>

        {/* Lista de Bienes Acumulados */}
        {bienesSession.length === 0 ? (
          <View className="bg-white rounded-2xl border border-slate-200 p-8 items-center mb-6">
            <Text className="text-xs text-slate-400 font-semibold text-center">
              No hay bienes agregados para vincular.{'\n'}
              Toca el botón superior para escanear o escribir un código QR.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5 mb-6">
            {bienesSession.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 flex-row items-center shadow-2xs"
              >
                <BienThumbnail
                  fotoUrl={item.foto_url}
                  categoria={item.categoria}
                  size={44}
                />

                <View className="flex-1 ml-3 mr-2">
                  <Text className="text-sm font-bold text-slate-800 leading-snug" numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text className="font-mono text-xs text-blue-900 font-bold mt-0.5">
                    {item.codigo_qr}
                  </Text>
                </View>

                {/* Acciones */}
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="p-1.5"
                    onPress={() => router.push(`/bien/${encodeURIComponent(item.codigo_qr)}`)}
                  >
                    <Edit2 size={16} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="p-1.5"
                    onPress={() => handleRemoveBien(item.id)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botón Inferior Fijo de Guardar Vinculación */}
      <View className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <TouchableOpacity
          className="bg-red-700 py-3.5 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90"
          onPress={handleGuardarVinculacion}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text className="text-white font-extrabold text-base ml-2">
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
        <SafeAreaView className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%] p-5 shadow-2xl">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-extrabold text-slate-900">
                Seleccionar Responsable
              </Text>
              <TouchableOpacity onPress={() => setWorkerModalVisible(false)}>
                <Text className="text-sm font-bold text-red-700">Cerrar</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador de trabajadores */}
            <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-2.5 mb-3 border border-slate-200">
              <Search size={16} color="#64748B" />
              <TextInput
                className="flex-1 ml-2 text-sm text-slate-800"
                placeholder="Buscar por nombre o DNI..."
                value={workerSearch}
                onChangeText={setWorkerSearch}
                onSubmitEditing={openWorkerSelector}
              />
            </View>

            {loadingWorkers ? (
              <ActivityIndicator color="#B91C1C" className="my-6" />
            ) : (
              <ScrollView className="max-h-80">
                {workersList.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    className="py-3 px-3 border-b border-slate-100 flex-row items-center justify-between active:bg-slate-50 rounded-xl"
                    onPress={() => handleSelectWorker(w)}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-800">
                        {w.nombre_completo}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        DNI: {w.dni} · {w.cargo}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-blue-900">
                      {w.oficina?.sigla}
                    </Text>
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
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-base font-extrabold text-slate-900 mb-1">
              Agregar Bien al Kit
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Escribe o escanea el código QR del bien municipal.
            </Text>

            <TextInput
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-3 text-slate-800 font-mono text-sm mb-5"
              placeholder="Ej: MARCONA-EQ-001"
              value={qrInput}
              onChangeText={setQrInput}
              autoCapitalize="characters"
              autoFocus
            />

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 rounded-xl items-center"
                onPress={() => setAddModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 bg-red-700 rounded-xl items-center"
                onPress={handleAddBienByQr}
                disabled={loadingAdd}
              >
                {loadingAdd ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
