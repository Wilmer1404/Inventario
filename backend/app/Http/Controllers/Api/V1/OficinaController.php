<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Oficina;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class OficinaController extends Controller
{
    use ApiResponse;

    /**
     * Listar oficinas municipales activas.
     */
    public function index(): JsonResponse
    {
        $oficinas = Oficina::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get();

        return $this->successResponse($oficinas, 'Listado de oficinas activas recuperado.');
    }
}
