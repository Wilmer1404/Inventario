<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_qr' => ['required', 'string', 'unique:bienes,codigo_qr'],
            'codigo_patrimonial' => ['nullable', 'string', 'max:50'],
            'tipo_gestion' => ['nullable', 'in:ACTIVO_UNICO,CONSUMIBLE'],
            'nombre' => ['required', 'string', 'max:255'],
            'categoria' => ['required', 'string', 'max:100'],
            'marca' => ['required', 'string', 'max:100'],
            'modelo' => ['required', 'string', 'max:100'],
            'numero_serie' => ['nullable', 'string', 'max:100'],
            'estado_conservacion' => ['nullable', 'in:BUENO,REGULAR,MALO,EN_REPARACION,BAJA'],
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'trabajador_id' => ['nullable', 'exists:trabajadores,id'],
            'observaciones' => ['nullable', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Datos de validación inválidos.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
