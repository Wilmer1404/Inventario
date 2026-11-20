<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trabajador extends Model
{
    use HasFactory;

    protected $table = 'trabajadores';

    protected $fillable = [
        'dni',
        'nombre_completo',
        'cargo',
        'oficina_id',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /**
     * Oficina a la que pertenece el trabajador.
     */
    public function oficina(): BelongsTo
    {
        return $this->belongsTo(Oficina::class, 'oficina_id');
    }

    /**
     * Bienes actualmente en custodia de este trabajador.
     */
    public function bienes(): HasMany
    {
        return $this->hasMany(Bien::class, 'trabajador_id');
    }
}
