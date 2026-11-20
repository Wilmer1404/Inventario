<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bien extends Model
{
    use HasFactory;

    protected $table = 'bienes';

    protected $fillable = [
        'codigo_qr',
        'codigo_patrimonial',
        'tipo_gestion',
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
    ];

    /**
     * Oficina donde se encuentra asignado o ubicado el bien.
     */
    public function oficina(): BelongsTo
    {
        return $this->belongsTo(Oficina::class, 'oficina_id');
    }

    /**
     * Trabajador que custodia actualmente el bien (si aplica).
     */
    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_id');
    }

    /**
     * Verificaciones históricas de inventario para este bien.
     */
    public function verificaciones(): HasMany
    {
        return $this->hasMany(VerificacionInventario::class, 'bien_id');
    }

    /**
     * Trazabilidad y movimientos de este bien.
     */
    public function historialMovimientos(): HasMany
    {
        return $this->hasMany(HistorialMovimiento::class, 'bien_id');
    }
}
