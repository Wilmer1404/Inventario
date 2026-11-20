import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  LogOut,
  ShieldCheck,
  CreditCard,
  Mail,
  Building,
  Server,
  Calendar,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { authStore } from '../../src/store/authStore';
import { EscudoMarcona } from '../../src/components/EscudoMarcona';
import { CampanaInventario, User as UserType } from '../../src/types';

export default function PerfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [campana, setCampana] = useState<CampanaInventario | null>(null);

  useEffect(() => {
    authStore.getUser().then((u) => {
      if (u) setUser(u);
    });

    apiClient
      .get('/campanas/activa')
      .then((res) => {
        if (res.data.success) {
          setCampana(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Desea cerrar la sesión actual del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/auth/logout');
            } catch {
              // Continuar con limpieza local
            } finally {
              await authStore.clearAuth();
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-5 pt-3 pb-3 shadow-2xs">
        <Text className="text-base font-extrabold text-slate-900">
          Mi Cuenta y Configuración
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-5" showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Identidad */}
        <View className="bg-white rounded-3xl border border-slate-200 p-6 items-center shadow-sm mb-5">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center p-2 mb-3 border border-slate-200">
            <EscudoMarcona size={54} />
          </View>

          <Text className="text-lg font-extrabold text-slate-900 text-center">
            {user?.name || 'Carlos Mendoza Sánchez'}
          </Text>

          <View className="bg-blue-100 px-3 py-1 rounded-full mt-1.5 flex-row items-center">
            <ShieldCheck size={13} color="#1E3A8A" />
            <Text className="text-blue-900 font-extrabold text-xs uppercase ml-1">
              {user?.rol || 'INVENTARIADOR'}
            </Text>
          </View>
        </View>

        {/* Datos de Sesión */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Datos del Usuario
          </Text>

          <View className="py-2.5 border-b border-slate-100 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <CreditCard size={16} color="#64748B" />
              <Text className="text-xs text-slate-500 ml-2.5">DNI:</Text>
            </View>
            <Text className="text-xs font-mono font-bold text-slate-800">
              {user?.dni || '45821930'}
            </Text>
          </View>

          <View className="py-2.5 border-b border-slate-100 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Mail size={16} color="#64748B" />
              <Text className="text-xs text-slate-500 ml-2.5">Correo:</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">
              {user?.email || 'cmendoza@marcona.gob.pe'}
            </Text>
          </View>

          <View className="py-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Building size={16} color="#64748B" />
              <Text className="text-xs text-slate-500 ml-2.5">Municipio:</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">
              Muni. Distrital de Marcona
            </Text>
          </View>
        </View>

        {/* Campaña Activa */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Campaña Activa en el Servidor
          </Text>
          <View className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center flex-1 pr-2">
              <Calendar size={16} color="#B45309" />
              <Text className="text-xs font-bold text-slate-800 ml-2.5">
                {campana?.nombre || 'Inventario Físico 2026'}
              </Text>
            </View>
            <View className="bg-green-100 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-green-700">ACTIVA</Text>
            </View>
          </View>
        </View>

        {/* Configuración de API (Solo lectura) */}
        <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Conexión de API (Solo Lectura)
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <Server size={16} color="#64748B" />
            <Text className="text-xs font-mono text-slate-600 ml-2 flex-1" numberOfLines={1}>
              {apiUrl}
            </Text>
          </View>
        </View>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity
          className="bg-red-50 border border-red-200 py-3.5 rounded-2xl flex-row items-center justify-center active:opacity-90 mb-8"
          onPress={handleLogout}
        >
          <LogOut size={18} color="#B91C1C" />
          <Text className="text-red-700 font-extrabold text-sm ml-2">
            Cerrar Sesión Activa
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
