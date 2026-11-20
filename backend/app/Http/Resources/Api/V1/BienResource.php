<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Bien;
use App\Models\CampanaInventario;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BienResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Buscar campaña activa para evaluar estado en inventario
        $campanaActiva = CampanaInventario::where('estado', 'ACTIVA')->first();

        $verificacion = null;
        if ($campanaActiva) {
            if ($this->relationLoaded('verificaciones')) {
                $verificacion = $this->verificaciones->firstWhere('campana_id', $campanaActiva->id);
            } else {
                $verificacion = $this->verificaciones()
                    ->where('campana_id', $campanaActiva->id)
                    ->with('user')
                    ->latest('fecha_verificacion')
                    ->first();
            }
        }

        $estadoInventario = 'PENDIENTE';
        if ($verificacion) {
            $estadoStr = strtoupper($verificacion->estado_verificado);
            if (in_array($estadoStr, ['FALTANTE', 'NO_LOCALIZADO'])) {
                $estadoInventario = 'FALTANTE';
            } else {
                $estadoInventario = 'INVENTARIADO';
            }
        }

        // Otros bienes asignados al mismo trabajador (para la ficha del bien y detalle QR)
        $otrosBienes = [];
        if ($this->trabajador_id) {
            $otrosBienes = Bien::where('trabajador_id', $this->trabajador_id)
                ->where('id', '!=', $this->id)
                ->with(['verificaciones' => function ($q) use ($campanaActiva) {
                    if ($campanaActiva) {
                        $q->where('campana_id', $campanaActiva->id);
                    }
                }])
                ->get()
                ->map(function ($otro) use ($campanaActiva) {
                    $verifOtro = $campanaActiva ? $otro->verificaciones->firstWhere('campana_id', $campanaActiva->id) : null;
                    $estadoOtro = 'PENDIENTE';
                    if ($verifOtro) {
                        $est = strtoupper($verifOtro->estado_verificado);
                        if (in_array($est, ['FALTANTE', 'NO_LOCALIZADO'])) {
                            $estadoOtro = 'FALTANTE';
                        } else {
                            $estadoOtro = 'INVENTARIADO';
                        }
                    }

                    return [
                        'id' => $otro->id,
                        'codigo_qr' => $otro->codigo_qr,
                        'nombre' => $otro->nombre,
                        'foto_url' => $otro->foto_url,
                        'estado_inventario_actual' => $estadoOtro,
                    ];
                });
        }

        return [
            'id' => $this->id,
            'codigo_qr' => $this->codigo_qr,
            'codigo_patrimonial' => $this->codigo_patrimonial,
            'tipo_gestion' => $this->tipo_gestion,
            'nombre' => $this->nombre,
            'categoria' => $this->categoria,
            'marca' => $this->marca,
            'modelo' => $this->modelo,
            'numero_serie' => $this->numero_serie,
            'estado_conservacion' => $this->estado_conservacion,
            'foto_url' => $this->foto_url,
            'observaciones' => $this->observaciones,
            'oficina' => $this->whenLoaded('oficina', function () {
                return [
                    'id' => $this->oficina->id,
                    'codigo' => $this->oficina->codigo,
                    'nombre' => $this->oficina->nombre,
                    'sigla' => $this->oficina->sigla,
                ];
            }),
            'trabajador' => $this->whenLoaded('trabajador', function () {
                return $this->trabajador ? [
                    'id' => $this->trabajador->id,
                    'dni' => $this->trabajador->dni,
                    'nombre_completo' => $this->trabajador->nombre_completo,
                    'cargo' => $this->trabajador->cargo,
                ] : null;
            }),
            'estado_inventario_actual' => $estadoInventario,
            'ultima_verificacion' => $verificacion ? [
                'id' => $verificacion->id,
                'fecha' => $verificacion->fecha_verificacion?->toIso8601String(),
                'estado' => $verificacion->estado_verificado,
                'usuario' => $verificacion->user?->name,
                'observacion' => $verificacion->observacion,
            ] : null,
            'otros_bienes_vinculados' => $otrosBienes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
