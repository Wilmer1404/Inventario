<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\TrabajadorResource;
use App\Models\Trabajador;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrabajadorController extends Controller
{
    use ApiResponse;

    /**
     * Listar trabajadores municipales activos con soporte para búsqueda.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Trabajador::with('oficina')->where('activo', true);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('cargo', 'like', "%{$search}%");
            });
        }

        $trabajadores = $query->orderBy('nombre_completo', 'asc')->get();

        return $this->successResponse(
            TrabajadorResource::collection($trabajadores),
            'Listado de trabajadores recuperado exitosamente.'
        );
    }

    /**
     * Registro rápido de trabajador municipal.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dni' => ['required', 'string', 'size:8', 'unique:trabajadores,dni'],
            'nombre_completo' => ['required', 'string', 'max:255'],
            'cargo' => ['required', 'string', 'max:255'],
            'oficina_id' => ['required', 'integer', 'exists:oficinas,id'],
        ]);

        $trabajador = Trabajador::create([
            ...$validated,
            'activo' => true,
        ]);

        $trabajador->load('oficina');

        return $this->successResponse(
            new TrabajadorResource($trabajador),
            'Trabajador registrado exitosamente.',
            201
        );
    }
}
