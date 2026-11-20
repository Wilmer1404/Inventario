import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
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
import { MARCONA_COLORS } from '../../src/theme/styles';

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Cuenta y Configuración</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Identidad */}
        <View style={styles.identityCard}>
          <View style={styles.escudoCircle}>
            <EscudoMarcona size={54} />
          </View>

          <Text style={styles.userName}>
            {user?.name || 'Carlos Mendoza Sánchez'}
          </Text>

          <View style={styles.rolePill}>
            <ShieldCheck size={13} color={MARCONA_COLORS.blue} />
            <Text style={styles.rolePillText}>
              {user?.rol || 'INVENTARIADOR'}
            </Text>
          </View>
        </View>

        {/* Datos de Sesión */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Datos del Usuario</Text>

          <View style={styles.dataRow}>
            <View style={styles.dataLabelRow}>
              <CreditCard size={16} color={MARCONA_COLORS.slate500} />
              <Text style={styles.dataLabel}>DNI:</Text>
            </View>
            <Text style={styles.dataValueMono}>{user?.dni || '45821930'}</Text>
          </View>

          <View style={styles.dataRow}>
            <View style={styles.dataLabelRow}>
              <Mail size={16} color={MARCONA_COLORS.slate500} />
              <Text style={styles.dataLabel}>Correo:</Text>
            </View>
            <Text style={styles.dataValue}>{user?.email || 'cmendoza@marcona.gob.pe'}</Text>
          </View>

          <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
            <View style={styles.dataLabelRow}>
              <Building size={16} color={MARCONA_COLORS.slate500} />
              <Text style={styles.dataLabel}>Municipio:</Text>
            </View>
            <Text style={styles.dataValue}>Muni. Distrital de Marcona</Text>
          </View>
        </View>

        {/* Campaña Activa */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Campaña Activa en el Servidor</Text>
          <View style={styles.campaignRow}>
            <View style={styles.campaignLeft}>
              <Calendar size={16} color={MARCONA_COLORS.gold} />
              <Text style={styles.campaignName}>
                {campana?.nombre || 'Inventario Físico 2026'}
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>ACTIVA</Text>
            </View>
          </View>
        </View>

        {/* Configuración de API (Solo lectura) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Conexión de API (Solo Lectura)</Text>
          <View style={styles.apiBox}>
            <Server size={16} color={MARCONA_COLORS.slate500} />
            <Text style={styles.apiText} numberOfLines={1}>
              {apiUrl}
            </Text>
          </View>
        </View>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.88}
        >
          <LogOut size={18} color={MARCONA_COLORS.red} />
          <Text style={styles.logoutText}>Cerrar Sesión Activa</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  identityCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  escudoCircle: {
    width: 80,
    height: 80,
    backgroundColor: MARCONA_COLORS.slate100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    textAlign: 'center',
  },
  rolePill: {
    backgroundColor: MARCONA_COLORS.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rolePillText: {
    color: MARCONA_COLORS.blue,
    fontWeight: '800',
    fontSize: 11,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: MARCONA_COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dataRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    marginLeft: 8,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: MARCONA_COLORS.slate800,
  },
  dataValueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  campaignLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  campaignName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
    marginLeft: 8,
  },
  activeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: MARCONA_COLORS.green,
  },
  apiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MARCONA_COLORS.slate50,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  apiText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: MARCONA_COLORS.slate600,
    marginLeft: 8,
    flex: 1,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: MARCONA_COLORS.red,
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
});
