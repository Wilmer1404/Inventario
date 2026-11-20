<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    use ApiResponse;

    /**
     * Diagnóstico de salud del servicio API, versión PHP y base de datos.
     */
    public function check(): JsonResponse
    {
        $dbConnected = false;
        $dbDriver = config('database.default');

        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Throwable $e) {
            $dbConnected = false;
        }

        return $this->successResponse([
            'status' => 'UP',
            'timestamp' => now()->toIso8601String(),
            'app_name' => config('app.name'),
            'environment' => config('app.env'),
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database' => [
                'connected' => $dbConnected,
                'driver' => $dbDriver,
            ],
        ], 'Servicio de API operativo y saludable.');
    }
}
