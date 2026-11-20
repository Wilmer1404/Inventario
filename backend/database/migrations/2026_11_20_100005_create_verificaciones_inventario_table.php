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
        Schema::create('verificaciones_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campana_id')->constrained('campanas_inventario')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('bien_id')->constrained('bienes')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('estado_verificado'); // CONFORME, OBSERVADO, NO_LOCALIZADO, etc.
            $table->text('observacion')->nullable();
            $table->dateTime('fecha_verificacion');
            $table->timestamps();

            $table->unique(['campana_id', 'bien_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verificaciones_inventario');
    }
};
