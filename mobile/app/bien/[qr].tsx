import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Clock,
  Laptop,
} from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, BienVinculadoResumen, CampanaInventario } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

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
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={MARCONA_COLORS.red} />
        <Text style={styles.loadingText}>Cargando ficha patrimonial...</Text>
      </SafeAreaView>
    );
  }

  if (!bien) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <QrCode size={48} color={MARCONA_COLORS.slate400} />
        <Text style={styles.notFoundTitle}>Bien no encontrado</Text>
        <Text style={styles.notFoundText}>No existe ningún bien registrado con el código: {qr}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Regresar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isInventariado = bien.estado_inventario_actual === 'INVENTARIADO';
  const otrosBienes = bien.otros_bienes_vinculados || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={MARCONA_COLORS.slate700} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ficha del Bien</Text>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push('/(tabs)/escanear')}
          activeOpacity={0.7}
        >
          <QrCode size={18} color={MARCONA_COLORS.blue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Foto Superior Grande */}
        <View style={styles.photoCard}>
          {/* Contenedor Imagen con altura fija 200px */}
          <View style={styles.photoBox}>
            {bien.foto_url ? (
              <Image
                source={{ uri: bien.foto_url }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Laptop size={56} color={MARCONA_COLORS.slate400} />
                <Text style={styles.photoCategoryText}>{bien.categoria}</Text>
              </View>
            )}

            {/* Badges Flotantes Superiores en position: 'absolute' */}
            <View style={styles.badgeFloatingLeft}>
              <CheckCircle2 size={12} color={MARCONA_COLORS.green} />
              <Text style={styles.badgeFloatingTextLeft}>
                {bien.estado_conservacion || 'Bueno'}
              </Text>
            </View>

            <View
              style={[
                styles.badgeFloatingRight,
                isInventariado ? styles.badgeGreen : styles.badgeAmber,
              ]}
            >
              {isInventariado ? (
                <CheckCircle2 size={12} color={MARCONA_COLORS.green} />
              ) : (
                <Clock size={12} color={MARCONA_COLORS.gold} />
              )}
              <Text
                style={[
                  styles.badgeFloatingTextRight,
                  isInventariado
                    ? { color: MARCONA_COLORS.green }
                    : { color: MARCONA_COLORS.gold },
                ]}
              >
                {isInventariado ? 'Inventariado' : 'Pendiente de Inventario'}
              </Text>
            </View>
          </View>

          {/* Chip Azul con Código QR (selfStart) */}
          <View style={styles.qrChip}>
            <QrCode size={13} color={MARCONA_COLORS.blue} />
            <Text style={styles.qrChipText}>QR: {bien.codigo_qr}</Text>
          </View>

          {/* Título Grande */}
          <Text style={styles.bienTitle}>{bien.nombre}</Text>
        </View>

        {/* Botón de Confirmar Inventario o Banner */}
        {isInventariado ? (
          <View style={styles.verifiedBanner}>
            <CheckCircle2 size={24} color={MARCONA_COLORS.green} />
            <View style={styles.verifiedTextContainer}>
              <Text style={styles.verifiedTitle}>Bien Inventariado en Campaña Activa</Text>
              <Text style={styles.verifiedSubtitle}>
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
            style={styles.confirmBtn}
            onPress={handleConfirmarInventario}
            disabled={verifying}
            activeOpacity={0.88}
          >
            {verifying ? (
              <ActivityIndicator color={MARCONA_COLORS.white} />
            ) : (
              <>
                <CheckCircle2 size={20} color={MARCONA_COLORS.white} />
                <Text style={styles.confirmBtnText}>Confirmar como Inventariado</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Tarjeta Especificaciones Técnicas */}
        <View style={styles.card}>
          <Text style={styles.specTitle}>ESPECIFICACIONES TÉCNICAS</Text>

          {/* Grilla Real de 2 Columnas */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Marca</Text>
              <Text style={styles.specValue}>{bien.marca}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Modelo</Text>
              <Text style={styles.specValue}>{bien.modelo}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>N.º de Serie</Text>
              <Text style={styles.specValueMono}>{bien.numero_serie || 'S/N'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Categoría</Text>
              <Text style={styles.specValue}>{bien.categoria}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Oficina</Text>
            <Text style={styles.specValue}>
              {bien.oficina?.nombre || 'Subgerencia de Logística y Control Patrimonial'}
            </Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Responsable</Text>
            <Text style={styles.specValue}>
              {bien.trabajador
                ? `${bien.trabajador.nombre_completo} — DNI ${bien.trabajador.dni}`
                : 'Sin custodio asignado'}
            </Text>
          </View>
        </View>

        {/* Sección: Otros bienes vinculados */}
        {otrosBienes.length > 0 && (
          <View style={styles.linkedSection}>
            <Text style={styles.linkedTitle}>
              Otros bienes vinculados a este responsable ({otrosBienes.length})
            </Text>

            <View style={styles.linkedList}>
              {otrosBienes.map((otro: BienVinculadoResumen) => (
                <TouchableOpacity
                  key={otro.id}
                  style={styles.linkedCard}
                  onPress={() => router.push(`/bien/${encodeURIComponent(otro.codigo_qr)}`)}
                  activeOpacity={0.75}
                >
                  <BienThumbnail
                    fotoUrl={otro.foto_url}
                    categoria={otro.nombre}
                    size={42}
                  />

                  <View style={styles.linkedDetails}>
                    <Text style={styles.linkedName} numberOfLines={1}>
                      {otro.nombre}
                    </Text>
                    <Text style={styles.linkedQr}>{otro.codigo_qr}</Text>
                  </View>

                  <View
                    style={[
                      styles.linkedBadge,
                      otro.estado_inventario_actual === 'INVENTARIADO'
                        ? { backgroundColor: '#DCFCE7' }
                        : otro.estado_inventario_actual === 'FALTANTE'
                        ? { backgroundColor: '#FEE2E2' }
                        : { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.linkedBadgeText,
                        otro.estado_inventario_actual === 'INVENTARIADO'
                          ? { color: MARCONA_COLORS.green }
                          : otro.estado_inventario_actual === 'FALTANTE'
                          ? { color: MARCONA_COLORS.red }
                          : { color: MARCONA_COLORS.gold },
                      ]}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MARCONA_COLORS.slate50,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: MARCONA_COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: MARCONA_COLORS.slate500,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    marginTop: 14,
  },
  notFoundText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: MARCONA_COLORS.red,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: MARCONA_COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    backgroundColor: MARCONA_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MARCONA_COLORS.slate100,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: 14,
    paddingBottom: 28,
  },
  photoCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginBottom: 14,
  },
  photoBox: {
    height: 200,
    backgroundColor: MARCONA_COLORS.slate50,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate100,
    marginBottom: 14,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCategoryText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate400,
    fontWeight: '600',
    marginTop: 6,
  },
  badgeFloatingLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeFloatingTextLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: MARCONA_COLORS.green,
    marginLeft: 4,
  },
  badgeFloatingRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeGreen: {
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
    borderColor: '#BBF7D0',
  },
  badgeAmber: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderColor: '#FDE68A',
  },
  badgeFloatingTextRight: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  qrChip: {
    alignSelf: 'flex-start',
    backgroundColor: MARCONA_COLORS.blueLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrChipText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    marginLeft: 6,
  },
  bienTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
    lineHeight: 24,
  },
  verifiedBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  verifiedTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  verifiedSubtitle: {
    fontSize: 11,
    color: MARCONA_COLORS.green,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: MARCONA_COLORS.green,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: MARCONA_COLORS.green,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmBtnText: {
    color: MARCONA_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginBottom: 14,
  },
  specTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: MARCONA_COLORS.blue,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gridCol: {
    width: '50%',
    paddingRight: 8,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MARCONA_COLORS.slate400,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  specValueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  divider: {
    height: 1,
    backgroundColor: MARCONA_COLORS.slate100,
    marginVertical: 8,
  },
  specItem: {
    marginTop: 8,
  },
  linkedSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  linkedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MARCONA_COLORS.slate800,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  linkedList: {
    gap: 8,
  },
  linkedCard: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedDetails: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  linkedName: {
    fontSize: 13,
    fontWeight: '700',
    color: MARCONA_COLORS.slate800,
  },
  linkedQr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    color: MARCONA_COLORS.blue,
    marginTop: 2,
  },
  linkedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  linkedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
