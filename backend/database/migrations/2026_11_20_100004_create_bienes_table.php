<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bienes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_qr')->unique()->index();
            $table->string('codigo_patrimonial')->nullable()->index();
            $table->enum('tipo_gestion', ['ACTIVO_UNICO', 'CONSUMIBLE'])->default('ACTIVO_UNICO');
            $table->string('nombre');
            $table->string('categoria');
            $table->string('marca');
            $table->string('modelo');
            $table->string('numero_serie')->nullable();
            $table->enum('estado_conservacion', ['BUENO', 'REGULAR', 'MALO', 'EN_REPARACION', 'BAJA'])->default('BUENO');
            $table->foreignId('oficina_id')->constrained('oficinas')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('trabajador_id')->nullable()->constrained('trabajadores')->cascadeOnUpdate()->nullOnDelete();
            $table->string('foto_url')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bienes');
    }
};
