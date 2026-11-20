import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Megaphone,
  QrCode,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { authStore } from '../../src/store/authStore';
import { EscudoMarcona } from '../../src/components/EscudoMarcona';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { CampanaInventario, EscaneoReciente, User } from '../../src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [campana, setCampana] = useState<CampanaInventario | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const storedUser = await authStore.getUser();
      if (storedUser) setUser(storedUser);

      const res = await apiClient.get('/campanas/activa');
      if (res.data.success) {
        setCampana(res.data.data);
      }
    } catch {
      // Manejo seguro de error
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const totalBienes = campana?.total_bienes ?? 0;
  const inventariados = campana?.inventariados ?? 0;
  const pendientes = campana?.pendientes ?? 0;
  const faltantes = campana?.faltantes ?? 0;
  const porcentaje = campana?.porcentaje_avance ?? 0;
  const escaneos = campana?.escaneos_recientes ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header Superior Blanco */}
      <View className="bg-white border-b border-slate-200 px-5 pt-3 pb-3 flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center gap-3 flex-1">
          <EscudoMarcona size={38} />
          <View className="flex-1">
            <Text className="text-base font-extrabold text-slate-900 leading-tight" numberOfLines={1}>
              Hola, {user?.name || 'Carlos Mendoza'}
            </Text>
            <Text className="text-xs text-slate-500 font-medium">
              {user?.rol || 'Inventariador'} · Control Patrimonial
            </Text>
          </View>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
          <Bell size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
            colors={['#B91C1C']}
          />
        }
      >
        {/* Pill de Campaña Activa */}
        <View className="bg-amber-100 border border-amber-200 rounded-xl px-3.5 py-2 flex-row items-center justify-between mb-4 shadow-2xs">
          <View className="flex-row items-center flex-1 pr-2">
            <Megaphone size={14} color="#B45309" />
            <Text className="text-xs font-bold text-amber-800 ml-1.5" numberOfLines={1}>
              Campaña: {campana?.nombre || 'Inventario 2026'}
            </Text>
          </View>
          <Text className="font-mono text-xs font-extrabold text-amber-900">
            {totalBienes} bienes
          </Text>
        </View>

        {/* Tarjeta de Avance General */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-slate-800">Avance General</Text>
            <Text className="text-2xl font-black text-blue-900">{porcentaje}%</Text>
          </View>

          {/* Barra de Progreso */}
          <View className="h-3 bg-slate-100 rounded-full overflow-hidden flex-row mb-4">
            <View
              style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
              className="bg-green-700 h-full rounded-l-full"
            />
            <View
              style={{ width: `${Math.min(100 - porcentaje, Math.max(0, 15))}%` }}
              className="bg-blue-900 h-full"
            />
          </View>

          {/* 3 Mini Tarjetas */}
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-green-100/70 border border-green-200/60 rounded-xl p-2.5 items-center">
              <Text className="text-lg font-black text-green-800">{inventariados}</Text>
              <Text className="text-[10px] font-bold text-green-700 mt-0.5">Inventariados</Text>
            </View>

            <View className="flex-1 bg-amber-100/70 border border-amber-200/60 rounded-xl p-2.5 items-center">
              <Text className="text-lg font-black text-amber-800">{pendientes}</Text>
              <Text className="text-[10px] font-bold text-amber-700 mt-0.5">Pendientes</Text>
            </View>

            <View className="flex-1 bg-red-100/70 border border-red-200/60 rounded-xl p-2.5 items-center">
              <Text className="text-lg font-black text-red-800">{faltantes}</Text>
              <Text className="text-[10px] font-bold text-red-700 mt-0.5">Faltantes</Text>
            </View>
          </View>
        </View>

        {/* Fila de 2 Tarjetas de Acción Rápida */}
        <View className="flex-row gap-3 mb-5">
          {/* Acción Izquierda: Escanear */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm active:opacity-90"
            onPress={() => router.push({ pathname: '/(tabs)/escanear', params: { mode: 'rapido' } })}
          >
            <View className="w-11 h-11 rounded-xl bg-red-100 items-center justify-center mb-3">
              <QrCode size={22} color="#B91C1C" />
            </View>
            <Text className="text-sm font-bold text-slate-800 leading-tight">
              Escanear e Inventariar
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              Lectura rápida QR
            </Text>
          </TouchableOpacity>

          {/* Acción Derecha: Vincular Kit */}
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm active:opacity-90"
            onPress={() => router.push('/(tabs)/vincular')}
          >
            <View className="w-11 h-11 rounded-xl bg-blue-100 items-center justify-center mb-3">
              <Layers size={22} color="#1E3A8A" />
            </View>
            <Text className="text-sm font-bold text-slate-800 leading-tight">
              Vincular Kit a Trabajador
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              Asignación múltiple
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección Escaneos Recientes */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-slate-800">Escaneos Recientes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/bienes')}>
              <Text className="text-xs font-bold text-blue-700">Ver todos</Text>
            </TouchableOpacity>
          </View>

          {escaneos.length === 0 ? (
            <View className="bg-white rounded-2xl border border-slate-200 p-6 items-center">
              <Text className="text-xs text-slate-400 font-medium">
                No hay escaneos recientes en esta campaña.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {escaneos.map((item: EscaneoReciente) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 flex-row items-center shadow-2xs active:opacity-90"
                  onPress={() => router.push(`/bien/${encodeURIComponent(item.codigo_qr)}`)}
                >
                  <BienThumbnail
                    fotoUrl={item.foto_url}
                    categoria={item.categoria}
                    size={46}
                  />

                  <View className="flex-1 ml-3 mr-2">
                    <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text className="font-mono text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                      {item.codigo_qr} · {item.oficina || 'General'}
                    </Text>
                  </View>

                  <View className="bg-green-100 px-2.5 py-1 rounded-md">
                    <Text className="text-[11px] font-bold text-green-700">
                      Inventariado
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
