<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\VincularKitRequest;
use App\Http\Resources\Api\V1\BienResource;
use App\Models\Bien;
use App\Models\Trabajador;
use App\Services\KitVinculacionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class KitController extends Controller
{
    use ApiResponse;

    /**
     * Vincular múltiples bienes a un trabajador (Kit Informático / Mobiliario).
     */
    public function vincular(VincularKitRequest $request, KitVinculacionService $kitService): JsonResponse
    {
        $userId = $request->user()->id;
        $trabajadorId = (int) $request->input('trabajador_id');
        $bienesIds = (array) $request->input('bienes_ids');
        $motivo = $request->input('motivo');

        $resultado = $kitService->vincularKit($trabajadorId, $bienesIds, $userId, $motivo);

        return $this->successResponse(
            $resultado,
            "Se vincularon exitosamente {$resultado['total_vinculados']} bienes al trabajador."
        );
    }

    /**
     * Consultar el kit patrimonial asignado a un trabajador específico.
     */
    public function getByTrabajador(int $trabajador_id): JsonResponse
    {
        $trabajador = Trabajador::with('oficina')->find($trabajador_id);

        if (! $trabajador) {
            return $this->errorResponse('Trabajador no encontrado.', 404);
        }

        $bienes = Bien::where('trabajador_id', $trabajador_id)
            ->with('oficina')
            ->get();

        return $this->successResponse([
            'trabajador' => [
                'id' => $trabajador->id,
                'dni' => $trabajador->dni,
                'nombre_completo' => $trabajador->nombre_completo,
                'cargo' => $trabajador->cargo,
                'oficina' => $trabajador->oficina?->nombre,
            ],
            'total_bienes' => $bienes->count(),
            'bienes' => BienResource::collection($bienes),
        ], 'Kit de bienes del trabajador obtenido exitosamente.');
    }
}
