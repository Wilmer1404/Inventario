<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\HistorialMovimiento;
use App\Models\Trabajador;
use Illuminate\Support\Facades\DB;

class KitVinculacionService
{
    /**
     * Vincula un lote de bienes a un trabajador y registra la trazabilidad.
     *
     * @param int $trabajadorId
     * @param array<int> $bienesIds
     * @param int $userId
     * @param string|null $motivo
     * @return array
     */
    public function vincularKit(int $trabajadorId, array $bienesIds, int $userId, ?string $motivo = null): array
    {
        return DB::transaction(function () use ($trabajadorId, $bienesIds, $userId, $motivo) {
            $trabajador = Trabajador::with('oficina')->findOrFail($trabajadorId);
            $bienes = Bien::whereIn('id', $bienesIds)->get();
            $vinculados = [];

            foreach ($bienes as $bien) {
                $trabajadorAnteriorId = $bien->trabajador_id;

                // Actualizar custodia y oficina del bien a la oficina del trabajador
                $bien->trabajador_id = $trabajador->id;
                if ($trabajador->oficina_id) {
                    $bien->oficina_id = $trabajador->oficina_id;
                }
                $bien->save();

                // Registrar en historial de movimientos
                HistorialMovimiento::create([
                    'bien_id' => $bien->id,
                    'trabajador_anterior_id' => $trabajadorAnteriorId,
                    'trabajador_nuevo_id' => $trabajador->id,
                    'user_id' => $userId,
                    'tipo_accion' => 'VINCULACION_KIT',
                    'detalle' => $motivo ?? 'Asignación de bien en kit de trabajo',
                ]);

                $vinculados[] = [
                    'id' => $bien->id,
                    'codigo_qr' => $bien->codigo_qr,
                    'nombre' => $bien->nombre,
                ];
            }

            return [
                'trabajador_id' => $trabajador->id,
                'trabajador_nombre' => $trabajador->nombre_completo,
                'total_vinculados' => count($vinculados),
                'bienes' => $vinculados,
            ];
        });
    }
}
