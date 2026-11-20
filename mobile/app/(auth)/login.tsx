import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, IdCard, Landmark, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { authStore } from '../../src/store/authStore';
import { EscudoMarcona } from '../../src/components/EscudoMarcona';
import { MARCONA_COLORS } from '../../src/theme/styles';

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
      const msg =
        error.response?.data?.message || 'Credenciales inválidas o error de conexión con el servidor.';
      Alert.alert('Error de Acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerWrapper}>
            {/* Escudo en caja blanca fija 84x84 */}
            <View style={styles.escudoContainer}>
              <View style={styles.escudoBox}>
                <EscudoMarcona size={64} />
              </View>

              {/* Pill Azul Claro Centrada */}
              <View style={styles.pillContainer}>
                <Landmark size={14} color={MARCONA_COLORS.blue} />
                <Text style={styles.pillText}>Municipalidad Distrital de Marcona</Text>
              </View>

              <Text style={styles.title}>Patrimonio Marcona</Text>
              <Text style={styles.subtitle}>Control de Inventario y Bienes Físicos</Text>
            </View>

            {/* Tarjeta de Formulario */}
            <View style={styles.card}>
              {/* Campo Usuario o DNI */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Usuario o DNI</Text>
                <View style={styles.inputBox}>
                  <IdCard size={20} color={MARCONA_COLORS.slate500} />
                  <TextInput
                    style={styles.input}
                    placeholder="45821930"
                    placeholderTextColor={MARCONA_COLORS.slate400}
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    keyboardType="default"
                  />
                </View>
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputBox}>
                  <Lock size={20} color={MARCONA_COLORS.slate500} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={MARCONA_COLORS.slate400}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={MARCONA_COLORS.slate400} />
                    ) : (
                      <Eye size={18} color={MARCONA_COLORS.slate400} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón Principal Rojo */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color={MARCONA_COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Ingresar al Sistema</Text>
                    <ArrowRight size={18} color={MARCONA_COLORS.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              Control Patrimonial e Inventario • Marcona 2026
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MARCONA_COLORS.slate50,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  escudoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  escudoBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: MARCONA_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: MARCONA_COLORS.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: MARCONA_COLORS.slate500,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.slate700,
    marginBottom: 6,
  },
  inputBox: {
    height: 48,
    backgroundColor: MARCONA_COLORS.slate50,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: MARCONA_COLORS.slate900,
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: MARCONA_COLORS.red,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
    fontWeight: '700',
  },
  footerText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate400,
    textAlign: 'center',
    marginTop: 24,
  },
});
