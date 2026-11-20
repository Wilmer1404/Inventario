<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Oficina extends Model
{
    use HasFactory;

    protected $table = 'oficinas';

    protected $fillable = [
        'codigo',
        'nombre',
        'sigla',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /**
     * Trabajadores asignados a esta oficina.
     */
    public function trabajadores(): HasMany
    {
        return $this->hasMany(Trabajador::class, 'oficina_id');
    }

    /**
     * Bienes patrimoniales ubicados en esta oficina.
     */
    public function bienes(): HasMany
    {
        return $this->hasMany(Bien::class, 'oficina_id');
    }
}
