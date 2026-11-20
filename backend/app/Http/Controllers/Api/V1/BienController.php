<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBienRequest;
use App\Http\Resources\Api\V1\BienResource;
use App\Models\Bien;
use App\Models\CampanaInventario;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BienController extends Controller
{
    use ApiResponse;

    /**
     * Listar bienes patrimoniales con filtros opcionales (search, oficina, estado_inventario).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Bien::with(['oficina', 'trabajador', 'verificaciones']);

        // Filtro por oficina
        if ($request->filled('oficina_id')) {
            $query->where('oficina_id', $request->input('oficina_id'));
        }

        // Filtro por trabajador
        if ($request->filled('trabajador_id')) {
            $query->where('trabajador_id', $request->input('trabajador_id'));
        }

        // Filtro por texto de búsqueda (search o q)
        $searchTerm = $request->input('search', $request->input('q'));
        if (! empty($searchTerm)) {
            $search = trim($searchTerm);
            $query->where(function ($q) use ($search) {
                $q->where('codigo_qr', 'like', "%{$search}%")
                  ->orWhere('numero_serie', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%")
                  ->orWhere('marca', 'like', "%{$search}%")
                  ->orWhere('codigo_patrimonial', 'like', "%{$search}%")
                  ->orWhereHas('trabajador', function ($sub) use ($search) {
                      $sub->where('nombre_completo', 'like', "%{$search}%")
                          ->orWhere('dni', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por estado en campaña activa (TODOS, INVENTARIADO, PENDIENTE, FALTANTE)
        if ($request->filled('estado_inventario')) {
            $estadoFiltro = strtoupper(trim($request->input('estado_inventario')));
            $campanaActiva = CampanaInventario::where('estado', 'ACTIVA')->first();

            if ($campanaActiva && in_array($estadoFiltro, ['INVENTARIADO', 'PENDIENTE', 'FALTANTE'])) {
                if ($estadoFiltro === 'INVENTARIADO') {
                    $query->whereHas('verificaciones', function ($sub) use ($campanaActiva) {
                        $sub->where('campana_id', $campanaActiva->id)
                            ->whereNotIn('estado_verificado', ['FALTANTE', 'NO_LOCALIZADO']);
                    });
                } elseif ($estadoFiltro === 'FALTANTE') {
                    $query->whereHas('verificaciones', function ($sub) use ($campanaActiva) {
                        $sub->where('campana_id', $campanaActiva->id)
                            ->whereIn('estado_verificado', ['FALTANTE', 'NO_LOCALIZADO']);
                    });
                } elseif ($estadoFiltro === 'PENDIENTE') {
                    $query->whereDoesntHave('verificaciones', function ($sub) use ($campanaActiva) {
                        $sub->where('campana_id', $campanaActiva->id);
                    });
                }
            }
        }

        $bienes = $query->orderBy('id', 'desc')->paginate($request->input('per_page', 20));

        return $this->successResponse([
            'items' => BienResource::collection($bienes),
            'pagination' => [
                'current_page' => $bienes->currentPage(),
                'last_page' => $bienes->lastPage(),
                'per_page' => $bienes->perPage(),
                'total' => $bienes->total(),
            ],
        ], 'Listado de bienes obtenido.');
    }

    /**
     * Localizar bien patrimonial mediante su código QR.
     */
    public function showByQr(string $codigo_qr): JsonResponse
    {
        $bien = Bien::with(['oficina', 'trabajador', 'verificaciones'])
            ->where('codigo_qr', trim($codigo_qr))
            ->first();

        if (! $bien) {
            return $this->errorResponse("No se encontró ningún bien patrimonial con el código QR '{$codigo_qr}'.", 404);
        }

        return $this->successResponse(new BienResource($bien), 'Bien patrimonial localizado exitosamente.');
    }

    /**
     * Registrar un nuevo bien patrimonial.
     */
    public function store(StoreBienRequest $request): JsonResponse
    {
        $bien = Bien::create($request->validated());
        $bien->load(['oficina', 'trabajador', 'verificaciones']);

        return $this->successResponse(new BienResource($bien), 'Bien patrimonial registrado exitosamente.', 201);
    }

    /**
     * Obtener detalle de un bien por Route Model Binding (Bien $bien).
     */
    public function show(Bien $bien): JsonResponse
    {
        $bien->load(['oficina', 'trabajador', 'verificaciones']);

        return $this->successResponse(new BienResource($bien), 'Detalle del bien recuperado.');
    }

    /**
     * Actualizar datos de un bien patrimonial.
     */
    public function update(Request $request, Bien $bien): JsonResponse
    {
        $bien->update($request->only([
            'codigo_patrimonial',
            'nombre',
            'categoria',
            'marca',
            'modelo',
            'numero_serie',
            'estado_conservacion',
            'oficina_id',
            'trabajador_id',
            'foto_url',
            'observaciones',
        ]));

        $bien->load(['oficina', 'trabajador', 'verificaciones']);

        return $this->successResponse(new BienResource($bien), 'Bien patrimonial actualizado exitosamente.');
    }

    /**
     * Eliminar un bien patrimonial.
     */
    public function destroy(Bien $bien): JsonResponse
    {
        $bien->delete();

        return $this->successResponse(null, 'Bien patrimonial eliminado exitosamente.');
    }

    /**
     * Subir foto del bien patrimonial (multipart/form-data).
     */
    public function subirFoto(Request $request, Bien $bien): JsonResponse
    {
        $request->validate([
            'foto' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ]);

        $file = $request->file('foto');
        $fileName = 'bien_' . $bien->id . '_' . time() . '.' . $file->getClientOriginalExtension();

        // Almacenar en storage/app/public/bienes
        $path = $file->storeAs('bienes', $fileName, 'public');

        // Generar URL pública
        $fotoUrl = Storage::disk('public')->url($path);

        $bien->foto_url = $fotoUrl;
        $bien->save();
        $bien->load(['oficina', 'trabajador', 'verificaciones']);

        return $this->successResponse([
            'foto_url' => $fotoUrl,
            'bien' => new BienResource($bien),
        ], 'Foto del bien subida y actualizada exitosamente.');
    }
}
