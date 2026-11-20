import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, CreditCard, Landmark, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { authStore } from '../../src/store/authStore';
import { EscudoMarcona } from '../../src/components/EscudoMarcona';

export default function LoginScreen() {
  const router = useRouter();
  const [login, setLogin] = useState('10000001');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Atención', 'Por favor ingrese su usuario/DNI y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', {
        login: login.trim(),
        password: password.trim(),
        device_name: 'App Móvil Marcona',
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        await authStore.saveAuth(token, user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', response.data.message || 'Error al iniciar sesión.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Credenciales inválidas o error de conexión.';
      Alert.alert('Error de Acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y Encabezado */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-white rounded-3xl p-3 items-center justify-center shadow-md border border-slate-100 mb-4">
              <EscudoMarcona size={72} />
            </View>

            {/* Pill Institucional */}
            <View className="flex-row items-center bg-blue-100/80 px-3.5 py-1.5 rounded-full mb-3">
              <Landmark size={14} color="#1E3A8A" />
              <Text className="text-xs font-bold text-blue-900 ml-1.5">
                Municipalidad Distrital de Marcona
              </Text>
            </View>

            <Text className="text-2xl font-extrabold text-slate-900 text-center">
              Patrimonio Marcona
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1">
              Control de Inventario y Bienes Físicos
            </Text>
          </View>

          {/* Tarjeta de Formulario */}
          <View className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            {/* Campo Usuario o DNI */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Usuario o DNI
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <CreditCard size={18} color="#64748B" />
                <TextInput
                  className="flex-1 ml-2.5 text-slate-800 text-sm font-medium"
                  placeholder="Ej: 45821930 o 10000001"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  keyboardType="default"
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Contraseña
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <Lock size={18} color="#64748B" />
                <TextInput
                  className="flex-1 ml-2.5 text-slate-800 text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Principal */}
            <TouchableOpacity
              className="bg-red-700 py-3.5 rounded-xl flex-row items-center justify-center shadow-md active:opacity-90"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-bold text-base mr-2">
                    Ingresar al Sistema
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Pie */}
          <Text className="text-xs text-slate-400 text-center mt-8">
            Control Patrimonial e Inventario • Marcona 2026
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
