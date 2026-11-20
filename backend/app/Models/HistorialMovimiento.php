<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialMovimiento extends Model
{
    use HasFactory;

    protected $table = 'historial_movimientos';

    protected $fillable = [
        'bien_id',
        'trabajador_anterior_id',
        'trabajador_nuevo_id',
        'user_id',
        'tipo_accion',
        'detalle',
    ];

    /**
     * Bien asociado a este movimiento.
     */
    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class, 'bien_id');
    }

    /**
     * Trabajador que poseía la custodia previa (si existía).
     */
    public function trabajadorAnterior(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_anterior_id');
    }

    /**
     * Trabajador que asume la nueva custodia.
     */
    public function trabajadorNuevo(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_nuevo_id');
    }

    /**
     * Usuario de la plataforma que registró el movimiento.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
