import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { CampanaInventario, User } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Superior Blanco */}
      <View style={styles.header}>
        <View style={styles.userInfoRow}>
          <EscudoMarcona size={40} />
          <View style={styles.userTextContainer}>
            <Text style={styles.greetingText} numberOfLines={1}>
              Hola, {user?.name || 'Carlos Mendoza'}
            </Text>
            <Text style={styles.roleText} numberOfLines={1}>
              {user?.rol || 'Inventariador'} · Control Patrimonial
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Bell size={18} color={MARCONA_COLORS.slate600} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
            colors={[MARCONA_COLORS.red]}
            tintColor={MARCONA_COLORS.red}
          />
        }
      >
        {/* Pill de Campaña Activa */}
        <View style={styles.campaignPill}>
          <View style={styles.campaignPillLeft}>
            <Megaphone size={14} color={MARCONA_COLORS.gold} />
            <Text style={styles.campaignPillText} numberOfLines={1}>
              Campaña: {campana?.nombre || 'Inventario 2026'}
            </Text>
          </View>
          <Text style={styles.campaignPillCount}>{totalBienes} bienes</Text>
        </View>

        {/* Tarjeta de Avance General */}
        <View style={styles.card}>
          <View style={styles.advanceHeader}>
            <Text style={styles.advanceTitle}>Avance General</Text>
            <Text style={styles.advancePercent}>{porcentaje}%</Text>
          </View>

          {/* Barra de Progreso */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.max(0, porcentaje))}%` },
              ]}
            />
          </View>

          {/* 3 mini-tarjetas en fila horizontal */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.metricNumber, { color: MARCONA_COLORS.green }]}>
                {inventariados}
              </Text>
              <Text style={[styles.metricLabel, { color: MARCONA_COLORS.green }]}>
                Inventariados
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.metricNumber, { color: MARCONA_COLORS.gold }]}>
                {pendientes}
              </Text>
              <Text style={[styles.metricLabel, { color: MARCONA_COLORS.gold }]}>
                Pendientes
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.metricNumber, { color: MARCONA_COLORS.red }]}>
                {faltantes}
              </Text>
              <Text style={[styles.metricLabel, { color: MARCONA_COLORS.red }]}>
                Faltantes
              </Text>
            </View>
          </View>
        </View>

        {/* Fila de 2 Acciones Rápidas */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/escanear')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
              <QrCode size={20} color={MARCONA_COLORS.red} />
            </View>
            <Text style={styles.actionTitle}>Escanear e Inventariar</Text>
            <Text style={styles.actionSubtitle}>Lectura rápida QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/vincular')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Layers size={20} color={MARCONA_COLORS.blue} />
            </View>
            <Text style={styles.actionTitle}>Vincular Kit a Trabajador</Text>
            <Text style={styles.actionSubtitle}>Asignación múltiple</Text>
          </TouchableOpacity>
        </View>

        {/* Sección Escaneos Recientes */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Escaneos Recientes</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/bienes')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Ver todos</Text>
              <ChevronRight size={14} color={MARCONA_COLORS.blue} />
            </TouchableOpacity>
          </View>

          {escaneos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay escaneos registrados aún.</Text>
            </View>
          ) : (
            escaneos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.scanCard}
                onPress={() => router.push(`/bien/${item.codigo_qr}`)}
                activeOpacity={0.7}
              >
                <BienThumbnail
                  size={48}
                  fotoUrl={null}
                  categoria={item.nombre}
                />

                <View style={styles.scanDetails}>
                  <Text style={styles.scanName} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.scanMeta} numberOfLines={1}>
                    {item.codigo_qr} · {item.oficina}
                  </Text>
                </View>

                <View style={styles.scanBadge}>
                  <Text style={styles.scanBadgeText}>Inventariado</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: MARCONA_COLORS.slate500,
    marginTop: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MARCONA_COLORS.slate100,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  campaignPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  campaignPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  campaignPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 6,
  },
  campaignPillCount: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  advanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  advanceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  advancePercent: {
    fontSize: 24,
    fontWeight: '900',
    color: MARCONA_COLORS.blue,
  },
  progressTrack: {
    height: 10,
    backgroundColor: MARCONA_COLORS.slate100,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 14,
  },
  progressBar: {
    backgroundColor: MARCONA_COLORS.green,
    height: '100%',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
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
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  actionSubtitle: {
    fontSize: 11,
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  recentSection: {
    marginTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    marginRight: 2,
  },
  emptyCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
  },
  emptyText: {
    fontSize: 13,
    color: MARCONA_COLORS.slate400,
  },
  scanCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  scanDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  scanName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate900,
  },
  scanMeta: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  scanBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scanBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: MARCONA_COLORS.green,
  },
});
