import { useState, type FC, type FormEvent } from 'react';
import { Link2, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/apiClient';

export const KitsPage: FC = () => {
  const [trabajadorId, setTrabajadorId] = useState('1');
  const [bienesIdsText, setBienesIdsText] = useState('1, 2, 3, 4');
  const [motivo, setMotivo] = useState('Asignación de Kit Tecnológico Estándar');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleVincular = async (e: FormEvent) => {
    e.preventDefault();
    setResultMessage(null);

    const ids = bienesIdsText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (!trabajadorId || ids.length === 0) {
      alert('Debe especificar un trabajador y al menos un ID de bien.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post('/kits/vincular', {
        trabajador_id: parseInt(trabajadorId, 10),
        bienes_ids: ids,
        motivo: motivo.trim(),
      });

      if (res.data.success) {
        setResultMessage(`¡Éxito! Se vincularon ${res.data.data.total_vinculados} bienes al trabajador correctamente.`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al vincular kit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Vinculación de Kits Patrimoniales</h2>
        <p className="text-xs text-slate-500">
          Asignación atómica de múltiples bienes (laptops, pantallas, impresoras) a un custodio responsable
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {resultMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 size={18} className="text-green-600" />
            <span>{resultMessage}</span>
          </div>
        )}

        <form onSubmit={handleVincular} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              ID del Trabajador Municipal
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="Ej: 1"
              value={trabajadorId}
              onChange={(e) => setTrabajadorId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              IDs de los Bienes (separados por coma)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="Ej: 1, 2, 3, 4"
              value={bienesIdsText}
              onChange={(e) => setBienesIdsText(e.target.value)}
              required
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Se registrará un movimiento histórico de custodia individual para cada activo seleccionado.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Motivo o Detalle de Asignación
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="Ej: Entrega de equipamiento para Subgerencia de Logística"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Link2 size={18} />
            <span>{loading ? 'Procesando Vinculación...' : 'Confirmar Vinculación de Kit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
