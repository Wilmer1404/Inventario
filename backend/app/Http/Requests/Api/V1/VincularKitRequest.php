<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class VincularKitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trabajador_id' => ['required', 'exists:trabajadores,id'],
            'bienes_ids' => ['required', 'array', 'min:1'],
            'bienes_ids.*' => ['integer', 'exists:bienes,id'],
            'motivo' => ['nullable', 'string', 'max:255'],
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
