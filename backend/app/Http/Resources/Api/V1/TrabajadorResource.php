<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrabajadorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dni' => $this->dni,
            'nombre_completo' => $this->nombre_completo,
            'cargo' => $this->cargo,
            'activo' => (bool) $this->activo,
            'oficina' => $this->whenLoaded('oficina', function () {
                return [
                    'id' => $this->oficina->id,
                    'codigo' => $this->oficina->codigo,
                    'nombre' => $this->oficina->nombre,
                    'sigla' => $this->oficina->sigla,
                ];
            }),
            'bienes' => BienResource::collection($this->whenLoaded('bienes')),
        ];
    }
}
