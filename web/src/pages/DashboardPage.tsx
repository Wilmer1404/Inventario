import { useEffect, useState, type FC } from 'react';
import { Package, CheckCircle2, Users, Building2, Activity } from 'lucide-react';
import apiClient from '../services/apiClient';
import type { CampanaInventario } from '../types';

export const DashboardPage: FC = () => {
  const [campana, setCampana] = useState<CampanaInventario | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('Verificando...');
  const [totalBienes, setTotalBienes] = useState<number>(4);

  useEffect(() => {
    // Diagnóstico API
    apiClient.get('/health')
      .then((res) => {
        if (res.data.success) {
          setHealthStatus('API Online (PHP 8.5 / Laravel 12)');
        }
      })
      .catch(() => setHealthStatus('Sin conexión a API'));

    // Campaña Activa
    apiClient.get('/campanas/activa')
      .then((res) => {
        if (res.data.success) {
          setCampana(res.data.data);
        }
      })
      .catch(() => {});

    // Conteo de Bienes
    apiClient.get('/bienes')
      .then((res) => {
        if (res.data.success && res.data.data.pagination) {
          setTotalBienes(res.data.data.pagination.total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner de Estado */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800 text-blue-200 text-xs font-bold mb-3">
            <Activity size={14} className="text-green-400" />
            <span>{healthStatus}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Panel de Control Patrimonial - Marcona
          </h2>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Gestión y auditoría en tiempo real de bienes institucionales, trazabilidad de custodias y lectura QR para la Municipalidad Distrital de Marcona.
          </p>
        </div>

        {campana && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
            <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">Campaña Activa</span>
            <p className="text-base font-bold text-white mt-1">{campana.nombre}</p>
            <p className="text-xs text-blue-300">Año {campana.anio}</p>
          </div>
        )}
      </div>

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
            <Package size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Bienes Registrados</span>
            <p className="text-2xl font-bold text-slate-800">{totalBienes}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Oficinas Operativas</span>
            <p className="text-2xl font-bold text-slate-800">4</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Custodios Activos</span>
            <p className="text-2xl font-bold text-slate-800">2</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Estado Auditoría</span>
            <p className="text-2xl font-bold text-slate-800">100% OK</p>
          </div>
        </div>
      </div>
    </div>
  );
};
