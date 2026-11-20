<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\CampanaInventario;
use App\Models\VerificacionInventario;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampanaController extends Controller
{
    use ApiResponse;

    /**
     * Listado de campañas de inventario.
     */
    public function index(): JsonResponse
    {
        $campanas = CampanaInventario::orderBy('anio', 'desc')->get();

        return $this->successResponse($campanas, 'Listado de campañas obtenido.');
    }

    /**
     * Campaña de inventario activa con métricas de avance y escaneos recientes.
     */
    public function activa(): JsonResponse
    {
        $campana = CampanaInventario::where('estado', 'ACTIVA')
            ->orderBy('id', 'desc')
            ->first();

        if (! $campana) {
            return $this->errorResponse('No existe una campaña de inventario activa en este momento.', 404);
        }

        $totalBienes = Bien::count();
        $verificaciones = VerificacionInventario::where('campana_id', $campana->id)->get();

        $faltantesCount = $verificaciones->whereIn('estado_verificado', ['FALTANTE', 'NO_LOCALIZADO'])->count();
        $inventariadosCount = $verificaciones->whereNotIn('estado_verificado', ['FALTANTE', 'NO_LOCALIZADO'])->count();
        $verificadosCount = $verificaciones->pluck('bien_id')->unique()->count();
        $pendientesCount = max(0, $totalBienes - $verificadosCount);
        $porcentajeAvance = $totalBienes > 0 ? (int) round(($inventariadosCount / $totalBienes) * 100) : 0;

        // Últimos 5 bienes verificados con oficina y estado
        $escaneosRecientes = VerificacionInventario::where('campana_id', $campana->id)
            ->with(['bien.oficina'])
            ->latest('fecha_verificacion')
            ->take(5)
            ->get()
            ->map(function ($verif) {
                return [
                    'id' => $verif->id,
                    'bien_id' => $verif->bien_id,
                    'codigo_qr' => $verif->bien?->codigo_qr,
                    'nombre' => $verif->bien?->nombre,
                    'categoria' => $verif->bien?->categoria,
                    'foto_url' => $verif->bien?->foto_url,
                    'oficina' => $verif->bien?->oficina?->nombre ?? $verif->bien?->oficina?->sigla,
                    'estado_verificado' => $verif->estado_verificado,
                    'fecha_verificacion' => $verif->fecha_verificacion?->toIso8601String(),
                ];
            });

        return $this->successResponse([
            'id' => $campana->id,
            'nombre' => $campana->nombre,
            'anio' => $campana->anio,
            'fecha_inicio' => $campana->fecha_inicio?->format('Y-m-d') ?? $campana->fecha_inicio,
            'fecha_fin' => $campana->fecha_fin?->format('Y-m-d') ?? $campana->fecha_fin,
            'estado' => $campana->estado,
            'total_bienes' => $totalBienes,
            'inventariados' => $inventariadosCount,
            'pendientes' => $pendientesCount,
            'faltantes' => $faltantesCount,
            'porcentaje_avance' => $porcentajeAvance,
            'escaneos_recientes' => $escaneosRecientes,
        ], 'Campaña de inventario activa recuperada exitosamente.');
    }

    /**
     * Resumen y estadísticas de verificaciones de una campaña.
     */
    public function verificaciones(int $campana_id): JsonResponse
    {
        $campana = CampanaInventario::find($campana_id);

        if (! $campana) {
            return $this->errorResponse('Campaña no encontrada.', 404);
        }

        $totalVerificados = VerificacionInventario::where('campana_id', $campana_id)->count();

        return $this->successResponse([
            'campana' => $campana,
            'total_verificados' => $totalVerificados,
        ], 'Resumen de verificaciones obtenido.');
    }

    /**
     * Registrar verificación física de un bien en una campaña.
     */
    public function storeVerificacion(Request $request): JsonResponse
    {
        $request->validate([
            'campana_id' => ['required', 'exists:campanas_inventario,id'],
            'bien_id' => ['required', 'exists:bienes,id'],
            'estado_verificado' => ['required', 'string'],
            'observacion' => ['nullable', 'string'],
        ]);

        $verificacion = VerificacionInventario::updateOrCreate(
            [
                'campana_id' => $request->input('campana_id'),
                'bien_id' => $request->input('bien_id'),
            ],
            [
                'user_id' => $request->user()->id,
                'estado_verificado' => $request->input('estado_verificado'),
                'observacion' => $request->input('observacion'),
                'fecha_verificacion' => now(),
            ]
        );

        $verificacion->load('bien.oficina');

        return $this->successResponse($verificacion, 'Verificación registrada exitosamente.', 201);
    }
}
