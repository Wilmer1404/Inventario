import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronDown, Building, PackageOpen } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, Oficina, EstadoInventario } from '../../src/types';

export default function BienesScreen() {
  const router = useRouter();

  const [bienes, setBienes] = useState<Bien[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | EstadoInventario>('TODOS');
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaModalVisible, setOficinaModalVisible] = useState(false);

  // Cargar oficinas
  useEffect(() => {
    apiClient
      .get('/oficinas')
      .then((res) => {
        if (res.data.success) {
          setOficinas(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const fetchBienes = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedOficina) {
        params.oficina_id = selectedOficina.id;
      }

      if (estadoFilter !== 'TODOS') {
        params.estado_inventario = estadoFilter;
      }

      const res = await apiClient.get('/bienes', { params });
      if (res.data.success) {
        setBienes(res.data.data.items || []);
        setTotalCount(res.data.data.pagination?.total ?? res.data.data.items?.length ?? 0);
      }
    } catch {
      // Manejo seguro
    } finally {
      setLoading(false);
    }
  }, [search, selectedOficina, estadoFilter]);

  useEffect(() => {
    fetchBienes();
  }, [fetchBienes]);

  const renderItem = ({ item }: { item: Bien }) => {
    const estado = item.estado_inventario_actual || 'PENDIENTE';

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-2xs active:opacity-90"
        onPress={() => router.push(`/bien/${encodeURIComponent(item.codigo_qr)}`)}
      >
        {/* Cabecera Tarjeta: QR a la izquierda, Badge a la derecha */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-md">
            {item.codigo_qr}
          </Text>

          <View
            className={`px-2.5 py-0.5 rounded-full ${
              estado === 'INVENTARIADO'
                ? 'bg-green-100 border border-green-200'
                : estado === 'FALTANTE'
                ? 'bg-red-100 border border-red-200'
                : 'bg-amber-100 border border-amber-200'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                estado === 'INVENTARIADO'
                  ? 'text-green-800'
                  : estado === 'FALTANTE'
                  ? 'text-red-800'
                  : 'text-amber-800'
              }`}
            >
              {estado === 'INVENTARIADO'
                ? 'Inventariado'
                : estado === 'FALTANTE'
                ? 'Faltante'
                : 'Pendiente'}
            </Text>
          </View>
        </View>

        {/* Fila Contenido: Miniatura + Nombre y Subtítulo */}
        <View className="flex-row items-center">
          <BienThumbnail
            fotoUrl={item.foto_url}
            categoria={item.categoria}
            size={48}
          />

          <View className="flex-1 ml-3">
            <Text className="text-sm font-extrabold text-slate-900 leading-snug" numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5" numberOfLines={1}>
              {item.trabajador?.nombre_completo || 'Sin responsable'} ·{' '}
              {item.oficina?.sigla || item.oficina?.nombre || 'General'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header Superior */}
      <View className="bg-white border-b border-slate-200 px-5 pt-3 pb-3 flex-row items-center justify-between shadow-2xs">
        <Text className="text-base font-extrabold text-slate-900">
          Catálogo de Bienes
        </Text>
        <Text className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {totalCount} totales
        </Text>
      </View>

      <View className="p-4 flex-1">
        {/* Barra de Búsqueda */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 mb-3 shadow-2xs">
          <Search size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-slate-800"
            placeholder="Buscar por QR, serie, marca o trabajador..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchBienes}
            returnKeyType="search"
          />
        </View>

        {/* Chips Horizontales de Estado con Scroll */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {(['TODOS', 'INVENTARIADO', 'PENDIENTE', 'FALTANTE'] as const).map((est) => {
              const isActive = estadoFilter === est;
              return (
                <TouchableOpacity
                  key={est}
                  className={`px-4 py-2 rounded-xl border ${
                    isActive
                      ? 'bg-blue-900 border-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}
                  onPress={() => setEstadoFilter(est)}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {est === 'TODOS'
                      ? 'Todos'
                      : est === 'INVENTARIADO'
                      ? 'Inventariados'
                      : est === 'PENDIENTE'
                      ? 'Pendientes'
                      : 'Faltantes'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Fila Selector Desplegable de Oficina */}
        <View className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 mb-4 shadow-2xs">
          <View className="flex-row items-center flex-1 pr-2">
            <Building size={15} color="#64748B" />
            <Text className="text-xs font-bold text-slate-700 ml-2">Oficina:</Text>
            <Text className="text-xs text-slate-500 ml-1.5 flex-1" numberOfLines={1}>
              {selectedOficina ? selectedOficina.nombre : 'Todas las oficinas'}
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center bg-slate-100 px-2.5 py-1 rounded-lg"
            onPress={() => setOficinaModalVisible(true)}
          >
            <Text className="text-xs font-bold text-blue-900 mr-1">Filtrar</Text>
            <ChevronDown size={14} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* Listado Principal de Bienes */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#B91C1C" />
            <Text className="text-xs text-slate-400 font-semibold mt-3">
              Cargando catálogo...
            </Text>
          </View>
        ) : (
          <FlatList
            data={bienes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center p-10 bg-white rounded-3xl border border-slate-200 mt-4">
                <PackageOpen size={48} color="#94A3B8" />
                <Text className="text-sm font-bold text-slate-700 mt-3">
                  No se encontraron bienes
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Prueba cambiando los filtros de búsqueda o estado.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal Desplegable Selector de Oficinas */}
      <Modal
        visible={oficinaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOficinaModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[75%] shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-extrabold text-slate-900">
                Seleccionar Oficina
              </Text>
              <TouchableOpacity onPress={() => setOficinaModalVisible(false)}>
                <Text className="text-sm font-bold text-red-700">Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-1">
              <TouchableOpacity
                className={`p-3.5 rounded-xl flex-row items-center justify-between ${
                  selectedOficina === null ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                } mb-1`}
                onPress={() => {
                  setSelectedOficina(null);
                  setOficinaModalVisible(false);
                }}
              >
                <Text className="text-sm font-bold text-slate-800">Todas las oficinas</Text>
                {selectedOficina === null && <Text className="text-xs font-bold text-blue-900">✓</Text>}
              </TouchableOpacity>

              {oficinas.map((of) => {
                const isSelected = selectedOficina?.id === of.id;
                return (
                  <TouchableOpacity
                    key={of.id}
                    className={`p-3.5 rounded-xl flex-row items-center justify-between ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                    } mb-1`}
                    onPress={() => {
                      setSelectedOficina(of);
                      setOficinaModalVisible(false);
                    }}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-slate-800">{of.nombre}</Text>
                      <Text className="text-xs text-slate-400">Sigla: {of.sigla}</Text>
                    </View>
                    {isSelected && <Text className="text-xs font-bold text-blue-900">✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
