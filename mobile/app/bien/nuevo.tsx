import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, QrCode, PlusCircle, Building, User, ChevronDown } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { Oficina, Trabajador, EstadoConservacion } from '../../src/types';

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
  const [estadoConservacion, setEstadoConservacion] = useState<EstadoConservacion>('BUENO');

  // Relaciones
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [oficinaModalVisible, setOficinaModalVisible] = useState(false);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
  const [trabajadorModalVisible, setTrabajadorModalVisible] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Cargar oficinas y trabajadores
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center shadow-2xs">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200 mr-3"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#334155" />
        </TouchableOpacity>

        <Text className="text-base font-extrabold text-slate-900">
          Registrar Nuevo Bien
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-5" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-6">
          {/* Código QR */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Código QR / Etiqueta *
            </Text>
            <View className="flex-row items-center bg-blue-50/80 border border-blue-200 rounded-xl px-3 py-2.5">
              <QrCode size={18} color="#1E3A8A" />
              <TextInput
                className="flex-1 ml-2 font-mono text-sm font-bold text-blue-900"
                placeholder="MDM-00150"
                value={codigoQr}
                onChangeText={setCodigoQr}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Nombre del Bien */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Descripción o Nombre *
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
              placeholder="Ej: Laptop HP ProBook 450 G9"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          {/* Código Patrimonial SBN */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Código Patrimonial SBN (Opcional)
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
              placeholder="Ej: 740877000120"
              value={codigoPatrimonial}
              onChangeText={setCodigoPatrimonial}
            />
          </View>

          {/* Categoría y Marca */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Categoría
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                placeholder="Cómputo"
                value={categoria}
                onChangeText={setCategoria}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Marca *
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                placeholder="HP, Lenovo..."
                value={marca}
                onChangeText={setMarca}
              />
            </View>
          </View>

          {/* Modelo y N° Serie */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Modelo *
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                placeholder="ProBook 450..."
                value={modelo}
                onChangeText={setModelo}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                N.º de Serie
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono"
                placeholder="5CD2348KLM"
                value={numeroSerie}
                onChangeText={setNumeroSerie}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Selector de Oficina */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Oficina de Asignación *
            </Text>
            <TouchableOpacity
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 flex-row items-center justify-between"
              onPress={() => setOficinaModalVisible(true)}
            >
              <View className="flex-row items-center flex-1 pr-2">
                <Building size={16} color="#64748B" />
                <Text className="text-sm font-semibold text-slate-800 ml-2" numberOfLines={1}>
                  {selectedOficina ? selectedOficina.nombre : 'Seleccionar Oficina'}
                </Text>
              </View>
              <ChevronDown size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Selector de Trabajador */}
          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Responsable / Custodio (Opcional)
            </Text>
            <TouchableOpacity
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 flex-row items-center justify-between"
              onPress={() => setTrabajadorModalVisible(true)}
            >
              <View className="flex-row items-center flex-1 pr-2">
                <User size={16} color="#64748B" />
                <Text className="text-sm font-semibold text-slate-800 ml-2" numberOfLines={1}>
                  {selectedTrabajador ? selectedTrabajador.nombre_completo : 'Sin asignar (disponible)'}
                </Text>
              </View>
              <ChevronDown size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Botón Registrar */}
          <TouchableOpacity
            className="bg-red-700 py-3.5 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90"
            onPress={handleRegistrarBien}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <PlusCircle size={18} color="#FFFFFF" />
                <Text className="text-white font-extrabold text-base ml-2">
                  Registrar Bien
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Oficina */}
      <Modal visible={oficinaModalVisible} transparent animationType="slide">
        <SafeAreaView className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[70%]">
            <Text className="text-base font-extrabold text-slate-900 mb-3">
              Seleccionar Oficina
            </Text>
            <ScrollView>
              {oficinas.map((of) => (
                <TouchableOpacity
                  key={of.id}
                  className="py-3 px-3 border-b border-slate-100 flex-row justify-between"
                  onPress={() => {
                    setSelectedOficina(of);
                    setOficinaModalVisible(false);
                  }}
                >
                  <Text className="text-sm font-bold text-slate-800">{of.nombre}</Text>
                  <Text className="text-xs text-blue-900 font-semibold">{of.sigla}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Trabajador */}
      <Modal visible={trabajadorModalVisible} transparent animationType="slide">
        <SafeAreaView className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[70%]">
            <Text className="text-base font-extrabold text-slate-900 mb-3">
              Seleccionar Responsable
            </Text>
            <ScrollView>
              <TouchableOpacity
                className="py-3 px-3 border-b border-slate-100"
                onPress={() => {
                  setSelectedTrabajador(null);
                  setTrabajadorModalVisible(false);
                }}
              >
                <Text className="text-sm font-semibold text-slate-500">Dejar sin asignar</Text>
              </TouchableOpacity>
              {trabajadores.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  className="py-3 px-3 border-b border-slate-100"
                  onPress={() => {
                    setSelectedTrabajador(t);
                    setTrabajadorModalVisible(false);
                  }}
                >
                  <Text className="text-sm font-bold text-slate-800">{t.nombre_completo}</Text>
                  <Text className="text-xs text-slate-400">{t.cargo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
