<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificacionInventario extends Model
{
    use HasFactory;

    protected $table = 'verificaciones_inventario';

    protected $fillable = [
        'campana_id',
        'bien_id',
        'user_id',
        'estado_verificado',
        'observacion',
        'fecha_verificacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_verificacion' => 'datetime',
        ];
    }

    /**
     * Campaña en la que se efectuó la verificación.
     */
    public function campana(): BelongsTo
    {
        return $this->belongsTo(CampanaInventario::class, 'campana_id');
    }

    /**
     * Bien patrimonial verificado.
     */
    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class, 'bien_id');
    }

    /**
     * Usuario/Inventariador que realizó el escaneo o verificación.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
