<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BienController;
use App\Http\Controllers\Api\V1\CampanaController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\KitController;
use App\Http\Controllers\Api\V1\OficinaController;
use App\Http\Controllers\Api\V1\TrabajadorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas API Versionadas (/api/v1) - Sistema Patrimonio Marcona
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Diagnóstico y salud del servicio
    Route::get('/health', [HealthController::class, 'check']);

    // Autenticación pública
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });

    // Rutas protegidas mediante tokens Bearer Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        // Autenticación y sesión
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });

        // Oficinas municipales
        Route::get('/oficinas', [OficinaController::class, 'index']);

        // Trabajadores municipales
        Route::get('/trabajadores', [TrabajadorController::class, 'index']);
        Route::post('/trabajadores', [TrabajadorController::class, 'store']);

        // Bienes patrimoniales y escaneo QR
        Route::get('/bienes/qr/{codigo_qr}', [BienController::class, 'showByQr']);
        Route::post('/bienes/{bien}/foto', [BienController::class, 'subirFoto']);
        Route::apiResource('bienes', BienController::class)->parameters(['bienes' => 'bien']);

        // Vinculación y gestión de Kits de trabajo
        Route::prefix('kits')->group(function () {
            Route::post('/vincular', [KitController::class, 'vincular']);
            Route::get('/trabajador/{trabajador_id}', [KitController::class, 'getByTrabajador']);
        });

        // Campañas de inventario y verificaciones
        Route::prefix('campanas')->group(function () {
            Route::get('/', [CampanaController::class, 'index']);
            Route::get('/activa', [CampanaController::class, 'activa']);
            Route::get('/{campana_id}/resumen', [CampanaController::class, 'verificaciones']);
        });

        Route::post('/verificaciones', [CampanaController::class, 'storeVerificacion']);
    });
});
