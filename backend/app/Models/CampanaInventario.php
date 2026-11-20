<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CampanaInventario extends Model
{
    use HasFactory;

    protected $table = 'campanas_inventario';

    protected $fillable = [
        'nombre',
        'anio',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'anio' => 'integer',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
        ];
    }

    /**
     * Verificaciones registradas durante esta campaña de inventario.
     */
    public function verificaciones(): HasMany
    {
        return $this->hasMany(VerificacionInventario::class, 'campana_id');
    }
}
