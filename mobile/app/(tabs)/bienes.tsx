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
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, ChevronDown, Building, PackageOpen } from 'lucide-react-native';
import apiClient from '../../src/services/apiClient';
import { BienThumbnail } from '../../src/components/BienThumbnail';
import { Bien, Oficina, EstadoInventario } from '../../src/types';
import { MARCONA_COLORS } from '../../src/theme/styles';

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
        style={styles.card}
        onPress={() => router.push(`/bien/${encodeURIComponent(item.codigo_qr)}`)}
        activeOpacity={0.85}
      >
        {/* Cabecera Tarjeta: QR a la izquierda, Badge a la derecha */}
        <View style={styles.cardHeader}>
          <Text style={styles.qrBadge}>{item.codigo_qr}</Text>

          <View
            style={[
              styles.statusBadge,
              estado === 'INVENTARIADO'
                ? styles.badgeInventariado
                : estado === 'FALTANTE'
                ? styles.badgeFaltante
                : styles.badgePendiente,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                estado === 'INVENTARIADO'
                  ? { color: MARCONA_COLORS.green }
                  : estado === 'FALTANTE'
                  ? { color: MARCONA_COLORS.red }
                  : { color: MARCONA_COLORS.gold },
              ]}
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
        <View style={styles.cardBody}>
          <BienThumbnail
            fotoUrl={item.foto_url}
            categoria={item.categoria}
            size={52}
          />

          <View style={styles.cardTexts}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.trabajador?.nombre_completo || 'Sin responsable'} ·{' '}
              {item.oficina?.sigla || item.oficina?.nombre || 'General'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Superior */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Bienes</Text>
        <Text style={styles.countBadge}>{totalCount} totales</Text>
      </View>

      <View style={styles.container}>
        {/* Barra de Búsqueda de Altura 44px */}
        <View style={styles.searchBar}>
          <Search size={18} color={MARCONA_COLORS.slate500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por QR, serie, marca o trabajador..."
            placeholderTextColor={MARCONA_COLORS.slate400}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchBienes}
            returnKeyType="search"
          />
        </View>

        {/* Chips Horizontales de Estado con Scroll */}
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {(['TODOS', 'INVENTARIADO', 'PENDIENTE', 'FALTANTE'] as const).map((est) => {
              const isActive = estadoFilter === est;
              return (
                <TouchableOpacity
                  key={est}
                  style={[
                    styles.chip,
                    isActive ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setEstadoFilter(est)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
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
        <View style={styles.officeSelectorRow}>
          <View style={styles.officeSelectorLeft}>
            <Building size={15} color={MARCONA_COLORS.slate500} />
            <Text style={styles.officeSelectorLabel}>Oficina:</Text>
            <Text style={styles.officeSelectorValue} numberOfLines={1}>
              {selectedOficina ? selectedOficina.nombre : 'Todas las oficinas'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setOficinaModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterBtnText}>Filtrar</Text>
            <ChevronDown size={14} color={MARCONA_COLORS.blue} />
          </TouchableOpacity>
        </View>

        {/* Listado Principal de Bienes */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={MARCONA_COLORS.red} />
            <Text style={styles.loaderText}>Cargando catálogo...</Text>
          </View>
        ) : (
          <FlatList
            data={bienes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <PackageOpen size={48} color={MARCONA_COLORS.slate400} />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptyText}>
                  No se encontraron bienes con los filtros seleccionados.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal Desplegable de Oficinas */}
      <Modal
        visible={oficinaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOficinaModalVisible(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Filtrar por Oficina</Text>
              <TouchableOpacity onPress={() => setOficinaModalVisible(false)}>
                <Text style={styles.modalSheetClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.officeOption,
                  !selectedOficina && styles.officeOptionActive,
                ]}
                onPress={() => {
                  setSelectedOficina(null);
                  setOficinaModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.officeOptionText,
                    !selectedOficina && styles.officeOptionTextActive,
                  ]}
                >
                  Todas las oficinas
                </Text>
              </TouchableOpacity>

              {oficinas.map((of) => {
                const isSel = selectedOficina?.id === of.id;
                return (
                  <TouchableOpacity
                    key={of.id}
                    style={[
                      styles.officeOption,
                      isSel && styles.officeOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedOficina(of);
                      setOficinaModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.officeOptionText,
                        isSel && styles.officeOptionTextActive,
                      ]}
                    >
                      {of.nombre} ({of.sigla})
                    </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  countBadge: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.slate500,
    backgroundColor: MARCONA_COLORS.slate100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    height: 44,
    backgroundColor: MARCONA_COLORS.white,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: MARCONA_COLORS.slate900,
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipsScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: MARCONA_COLORS.blue,
    borderColor: MARCONA_COLORS.blue,
  },
  chipInactive: {
    backgroundColor: MARCONA_COLORS.white,
    borderColor: MARCONA_COLORS.slate200,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: MARCONA_COLORS.white,
  },
  chipTextInactive: {
    color: MARCONA_COLORS.slate600,
  },
  officeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MARCONA_COLORS.white,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  officeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  officeSelectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.slate700,
    marginLeft: 6,
  },
  officeSelectorValue: {
    fontSize: 12,
    color: MARCONA_COLORS.slate500,
    marginLeft: 6,
    flex: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MARCONA_COLORS.slate100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    marginRight: 4,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate400,
    fontWeight: '600',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    padding: 14,
    marginBottom: 10,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qrBadge: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: MARCONA_COLORS.blue,
    backgroundColor: MARCONA_COLORS.blueSoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeInventariado: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  badgeFaltante: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  badgePendiente: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTexts: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: MARCONA_COLORS.slate500,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: MARCONA_COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MARCONA_COLORS.slate200,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MARCONA_COLORS.slate700,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 12,
    color: MARCONA_COLORS.slate400,
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: MARCONA_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MARCONA_COLORS.slate900,
  },
  modalSheetClose: {
    fontSize: 14,
    fontWeight: '700',
    color: MARCONA_COLORS.red,
  },
  modalScroll: {
    maxHeight: 320,
  },
  officeOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: MARCONA_COLORS.slate100,
    borderRadius: 10,
  },
  officeOptionActive: {
    backgroundColor: MARCONA_COLORS.blueSoft,
  },
  officeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: MARCONA_COLORS.slate800,
  },
  officeOptionTextActive: {
    color: MARCONA_COLORS.blue,
    fontWeight: '800',
  },
});
