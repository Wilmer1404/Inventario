import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Tag,
  Laptop,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, BienVinculadoResumen, CampanaInventario } from '../../src/types';

export default function FichaBienScreen() {
  const { qr } = useLocalSearchParams<{ qr: string }>();
  const router = useRouter();

  const [bien, setBien] = useState<Bien | null>(null);
  const [campana, setCampana] = useState<CampanaInventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchBienData = useCallback(async () => {
    if (!qr) return;
    try {
      setLoading(true);
      const [bienRes, campanaRes] = await Promise.all([
        apiClient.get(`/bienes/qr/${encodeURIComponent(qr)}`),
        apiClient.get('/campanas/activa').catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (bienRes.data.success) {
        setBien(bienRes.data.data);
      }
      if (campanaRes.data.success) {
        setCampana(campanaRes.data.data);
      }
    } catch (e: any) {
      Alert.alert(
        'Bien No Localizado',
        e.response?.data?.message || `No se encontró el bien con código QR ${qr}`
      );
    } finally {
      setLoading(false);
    }
  }, [qr]);

  useEffect(() => {
    fetchBienData();
  }, [fetchBienData]);

  const handleConfirmarInventario = async () => {
    if (!bien) return;

    try {
      setVerifying(true);
      const campanaId = campana?.id || 1;

      const res = await apiClient.post('/verificaciones', {
        campana_id: campanaId,
        bien_id: bien.id,
        estado_verificado: 'CONFORME',
        observacion: 'Inventariado físicamente mediante verificación móvil',
      });

      if (res.data.success) {
        setBien((prev) =>
          prev
            ? {
                ...prev,
                estado_inventario_actual: 'INVENTARIADO',
                ultima_verificacion: {
                  fecha: new Date().toISOString(),
                  estado: 'CONFORME',
                  usuario: 'Operador Móvil',
                },
              }
            : null
        );
        Alert.alert('¡Verificación Exitosa!', 'El bien quedó registrado como Inventariado.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Error al registrar inventario.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#B91C1C" />
        <Text className="text-slate-500 text-xs font-semibold mt-3">
          Cargando ficha patrimonial...
        </Text>
      </SafeAreaView>
    );
  }

  if (!bien) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <QrCode size={48} color="#94A3B8" />
        <Text className="text-slate-800 text-base font-bold mt-4">
          Bien no encontrado
        </Text>
        <Text className="text-slate-500 text-xs text-center mt-1 mb-6">
          No existe ningún bien registrado con el código: {qr}
        </Text>
        <TouchableOpacity
          className="bg-red-700 px-6 py-2.5 rounded-xl active:opacity-90"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-sm">Regresar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isInventariado = bien.estado_inventario_actual === 'INVENTARIADO';
  const otrosBienes = bien.otros_bienes_vinculados || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header Superior Limpio */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between shadow-2xs">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#334155" />
        </TouchableOpacity>

        <Text className="text-base font-extrabold text-slate-800">
          Ficha del Bien
        </Text>

        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
          onPress={() => router.push('/(tabs)/escanear')}
        >
          <QrCode size={18} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Foto Superior Grande */}
        <View className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm mb-4 relative">
          {/* Badges Flotantes Superiores */}
          <View className="flex-row items-center justify-between mb-3">
            {/* Estado Conservación (Izquierda) */}
            <View className="bg-green-100 border border-green-200 px-2.5 py-1 rounded-full flex-row items-center">
              <CheckCircle2 size={12} color="#15803D" />
              <Text className="text-[11px] font-bold text-green-800 ml-1">
                {bien.estado_conservacion || 'Bueno'}
              </Text>
            </View>

            {/* Estado Campaña (Derecha) */}
            {isInventariado ? (
              <View className="bg-green-100 border border-green-200 px-2.5 py-1 rounded-full flex-row items-center">
                <CheckCircle2 size={12} color="#15803D" />
                <Text className="text-[11px] font-bold text-green-800 ml-1">
                  Inventariado
                </Text>
              </View>
            ) : (
              <View className="bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex-row items-center">
                <Clock size={12} color="#B45309" />
                <Text className="text-[11px] font-bold text-amber-800 ml-1">
                  Pendiente de Inventario
                </Text>
              </View>
            )}
          </View>

          {/* Imagen o Contenedor Placeholder */}
          <View className="h-44 bg-slate-50 rounded-2xl items-center justify-center overflow-hidden border border-slate-100 mb-3">
            {bien.foto_url ? (
              <Image
                source={{ uri: bien.foto_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center justify-center">
                <Laptop size={54} color="#94A3B8" />
                <Text className="text-xs text-slate-400 font-semibold mt-2">
                  {bien.categoria}
                </Text>
              </View>
            )}
          </View>

          {/* Chip Azul con Código QR */}
          <View className="self-start bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-full flex-row items-center mb-2">
            <QrCode size={13} color="#1E3A8A" />
            <Text className="font-mono text-xs font-bold text-blue-900 ml-1.5">
              QR: {bien.codigo_qr}
            </Text>
          </View>

          {/* Título Grande */}
          <Text className="text-xl font-extrabold text-slate-900 leading-snug">
            {bien.nombre}
          </Text>
        </View>

        {/* Botón de Confirmar Inventario o Banner de Confirmación */}
        {isInventariado ? (
          <View className="bg-green-100/90 border border-green-300 rounded-2xl p-4 flex-row items-center mb-4 shadow-2xs">
            <CheckCircle2 size={24} color="#15803D" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-green-900">
                Bien Inventariado en Campaña Activa
              </Text>
              <Text className="text-xs text-green-700 mt-0.5">
                Verificado el{' '}
                {bien.ultima_verificacion?.fecha
                  ? new Date(bien.ultima_verificacion.fecha).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'en campaña'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-green-700 py-3.5 rounded-2xl flex-row items-center justify-center shadow-md active:opacity-90 mb-4"
            onPress={handleConfirmarInventario}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={20} color="#FFFFFF" />
                <Text className="text-white font-extrabold text-base ml-2">
                  Confirmar como Inventariado
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Tarjeta Especificaciones Técnicas */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
          <Text className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-4">
            ESPECIFICACIONES TÉCNICAS
          </Text>

          {/* Grilla 2 Columnas */}
          <View className="flex-row gap-4 mb-3">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-slate-400">Marca</Text>
              <Text className="text-sm font-bold text-slate-800">{bien.marca}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-slate-400">Modelo</Text>
              <Text className="text-sm font-bold text-slate-800">{bien.modelo}</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-slate-400">N.º de Serie</Text>
              <Text className="font-mono text-sm font-bold text-slate-800">
                {bien.numero_serie || 'S/N'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-slate-400">Categoría</Text>
              <Text className="text-sm font-bold text-slate-800">{bien.categoria}</Text>
            </View>
          </View>

          {/* Divisor */}
          <View className="h-px bg-slate-100 my-2" />

          {/* Oficina y Responsable */}
          <View className="mt-2 space-y-3">
            <View className="mb-2">
              <Text className="text-[11px] font-semibold text-slate-400">Oficina</Text>
              <Text className="text-sm font-bold text-slate-800">
                {bien.oficina?.nombre || 'Subgerencia de Logística y Control Patrimonial'}
              </Text>
            </View>

            <View>
              <Text className="text-[11px] font-semibold text-slate-400">Responsable</Text>
              <Text className="text-sm font-bold text-slate-800">
                {bien.trabajador
                  ? `${bien.trabajador.nombre_completo} — DNI ${bien.trabajador.dni}`
                  : 'Sin custodio asignado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Otros bienes vinculados a este responsable */}
        {otrosBienes.length > 0 && (
          <View className="mb-8">
            <Text className="text-sm font-extrabold text-slate-800 mb-3 px-1">
              Otros bienes vinculados a este responsable ({otrosBienes.length})
            </Text>

            <View className="gap-2.5">
              {otrosBienes.map((otro: BienVinculadoResumen) => (
                <TouchableOpacity
                  key={otro.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3 flex-row items-center shadow-2xs active:opacity-90"
                  onPress={() => router.push(`/bien/${encodeURIComponent(otro.codigo_qr)}`)}
                >
                  <BienThumbnail
                    fotoUrl={otro.foto_url}
                    categoria={otro.nombre}
                    size={42}
                  />

                  <View className="flex-1 ml-3 mr-2">
                    <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                      {otro.nombre}
                    </Text>
                    <Text className="font-mono text-xs text-blue-800 font-semibold mt-0.5">
                      {otro.codigo_qr}
                    </Text>
                  </View>

                  <View
                    className={`px-2 py-0.5 rounded-md ${
                      otro.estado_inventario_actual === 'INVENTARIADO'
                        ? 'bg-green-100'
                        : otro.estado_inventario_actual === 'FALTANTE'
                        ? 'bg-red-100'
                        : 'bg-amber-100'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        otro.estado_inventario_actual === 'INVENTARIADO'
                          ? 'text-green-700'
                          : otro.estado_inventario_actual === 'FALTANTE'
                          ? 'text-red-700'
                          : 'text-amber-800'
                      }`}
                    >
                      {otro.estado_inventario_actual === 'INVENTARIADO'
                        ? 'Inventariado'
                        : otro.estado_inventario_actual === 'FALTANTE'
                        ? 'Faltante'
                        : 'Pendiente'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
