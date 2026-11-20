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
        Schema::create('historial_movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('bienes')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('trabajador_anterior_id')->nullable()->constrained('trabajadores')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('trabajador_nuevo_id')->nullable()->constrained('trabajadores')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('tipo_accion'); // VINCULACION_KIT, DESVINCULACION, ASIGNACION, TRASLADO, CAMBIO_ESTADO
            $table->text('detalle')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_movimientos');
    }
};
