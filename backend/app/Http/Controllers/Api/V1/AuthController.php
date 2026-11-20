<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Iniciar sesión por DNI o correo institucional y emitir Token Sanctum.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = trim($request->input('login'));
        $password = $request->input('password');
        $deviceName = $request->input('device_name', 'Patrimonio Marcona App');

        // Buscar por DNI o por Email
        $user = User::where('dni', $login)
            ->orWhere('email', $login)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return $this->errorResponse('Las credenciales proporcionadas son incorrectas.', 401, [
                'login' => ['Credenciales inválidas para acceso al sistema.'],
            ]);
        }

        if (! $user->activo) {
            return $this->errorResponse('El usuario se encuentra inactivo. Comuníquese con Administración.', 403);
        }

        // Crear token de acceso personal Sanctum
        $token = $user->createToken($deviceName)->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 'Autenticación exitosa.');
    }

    /**
     * Obtener el perfil del usuario autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()),
            'Perfil de usuario recuperado exitosamente.'
        );
    }

    /**
     * Cerrar sesión revocando el token de acceso actual.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'Sesión cerrada y token revocado correctamente.');
    }
}
