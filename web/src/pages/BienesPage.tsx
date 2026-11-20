import { useEffect, useState, type FC } from 'react';
import { Search, QrCode, Tag, MapPin, User as UserIcon } from 'lucide-react';
import apiClient from '../services/apiClient';
import type { Bien } from '../types';

export const BienesPage: FC = () => {
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBienes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/bienes', {
        params: { q: search },
      });
      if (res.data.success) {
        setBienes(res.data.data.items || []);
      }
    } catch {
      // Manejo de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBienes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catálogo General de Bienes</h2>
          <p className="text-xs text-slate-500">Búsqueda y consulta de activos patrimoniales con código QR</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Buscar por QR, serie, modelo o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBienes()}
            />
          </div>
          <button
            onClick={fetchBienes}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla de Bienes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Código QR</th>
              <th className="px-5 py-3.5">Descripción del Bien</th>
              <th className="px-5 py-3.5">Categoría / Marca</th>
              <th className="px-5 py-3.5">Oficina Ubicación</th>
              <th className="px-5 py-3.5">Custodio Asignado</th>
              <th className="px-5 py-3.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Cargando bienes patrimoniales...
                </td>
              </tr>
            ) : bienes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No se encontraron bienes en el inventario.
                </td>
              </tr>
            ) : (
              bienes.map((bien) => (
                <tr key={bien.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                      <QrCode size={13} />
                      {bien.codigo_qr}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    <div>{bien.nombre}</div>
                    <div className="text-xs text-slate-400 font-normal">
                      S/N: {bien.numero_serie || 'Sin serie'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1 text-slate-600">
                      <Tag size={13} className="text-slate-400" />
                      {bien.categoria}
                    </div>
                    <div className="text-xs text-slate-400">
                      {bien.marca} {bien.modelo}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin size={13} className="text-slate-400" />
                      {bien.oficina?.sigla ? `[${bien.oficina.sigla}] ${bien.oficina.nombre}` : 'Sin oficina'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1 text-slate-600">
                      <UserIcon size={13} className="text-slate-400" />
                      {bien.trabajador ? bien.trabajador.nombre_completo : 'Sin asignar'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      {bien.estado_conservacion}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
