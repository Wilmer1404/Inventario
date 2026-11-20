<?php

namespace Database\Seeders;

use App\Models\Bien;
use App\Models\CampanaInventario;
use App\Models\Oficina;
use App\Models\Trabajador;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MarconaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Oficinas Municipales
        $oficinaAlcaldia = Oficina::firstOrCreate(
            ['codigo' => 'OF-ALC-01'],
            [
                'nombre' => 'Alcaldía',
                'sigla' => 'ALC',
                'activo' => true,
            ]
        );

        $oficinaAdministracion = Oficina::firstOrCreate(
            ['codigo' => 'OF-GAF-02'],
            [
                'nombre' => 'Gerencia de Administración y Finanzas',
                'sigla' => 'GAF',
                'activo' => true,
            ]
        );

        $oficinaTesoreria = Oficina::firstOrCreate(
            ['codigo' => 'OF-TES-03'],
            [
                'nombre' => 'Subgerencia de Tesorería',
                'sigla' => 'TES',
                'activo' => true,
            ]
        );

        $oficinaLogistica = Oficina::firstOrCreate(
            ['codigo' => 'OF-LOG-04'],
            [
                'nombre' => 'Subgerencia de Logística y Control Patrimonial',
                'sigla' => 'LOG',
                'activo' => true,
            ]
        );

        // 2. Usuario Administrador de Prueba
        $adminUser = User::firstOrCreate(
            ['dni' => '10000001'],
            [
                'name' => 'Admin Marcona',
                'email' => 'admin@marcona.gob.pe',
                'password' => Hash::make('password'),
                'rol' => 'ADMIN',
                'activo' => true,
            ]
        );

        // 3. Trabajadores Municipales
        $trabajador1 = Trabajador::firstOrCreate(
            ['dni' => '45678901'],
            [
                'nombre_completo' => 'Ing. Carlos Mendoza Sánchez',
                'cargo' => 'Especialista en Sistemas y Redes',
                'oficina_id' => $oficinaLogistica->id,
                'activo' => true,
            ]
        );

        $trabajador2 = Trabajador::firstOrCreate(
            ['dni' => '43219876'],
            [
                'nombre_completo' => 'Lic. Rosa Paredes Castro',
                'cargo' => 'Tesorera Municipal',
                'oficina_id' => $oficinaTesoreria->id,
                'activo' => true,
            ]
        );

        // 4. Campaña de Inventario Activa
        $campana = CampanaInventario::firstOrCreate(
            ['nombre' => 'Inventario Físico 2026'],
            [
                'anio' => 2026,
                'fecha_inicio' => '2026-01-15',
                'fecha_fin' => '2026-12-31',
                'estado' => 'ACTIVA',
            ]
        );

        // 5. Bienes con QR Único (Kit Tecnológico asignado a Carlos Mendoza)
        $bienesData = [
            [
                'codigo_qr' => 'MARCONA-EQ-001',
                'codigo_patrimonial' => '740877000001',
                'tipo_gestion' => 'ACTIVO_UNICO',
                'nombre' => 'Laptop Lenovo ThinkPad T14 Gen 3',
                'categoria' => 'Equipos de Cómputo',
                'marca' => 'Lenovo',
                'modelo' => 'ThinkPad T14 Gen 3',
                'numero_serie' => 'PF-4Y2819',
                'estado_conservacion' => 'BUENO',
                'oficina_id' => $oficinaLogistica->id,
                'trabajador_id' => $trabajador1->id,
                'observaciones' => 'Equipo de cómputo principal asignado con kit tecnológico institucional.',
            ],
            [
                'codigo_qr' => 'MARCONA-EQ-002',
                'codigo_patrimonial' => '740877000002',
                'tipo_gestion' => 'ACTIVO_UNICO',
                'nombre' => 'Monitor Dell UltraSharp 27" 4K',
                'categoria' => 'Equipos de Cómputo',
                'marca' => 'Dell',
                'modelo' => 'U2723QE',
                'numero_serie' => 'CN-0R856M',
                'estado_conservacion' => 'BUENO',
                'oficina_id' => $oficinaLogistica->id,
                'trabajador_id' => $trabajador1->id,
                'observaciones' => 'Monitor secundario de alta resolución asignado a la estación de trabajo.',
            ],
            [
                'codigo_qr' => 'MARCONA-EQ-003',
                'codigo_patrimonial' => '740877000003',
                'tipo_gestion' => 'ACTIVO_UNICO',
                'nombre' => 'Impresora Láser HP LaserJet Pro M404dw',
                'categoria' => 'Equipos de Cómputo',
                'marca' => 'HP',
                'modelo' => 'LaserJet Pro M404dw',
                'numero_serie' => 'VNC3K92110',
                'estado_conservacion' => 'BUENO',
                'oficina_id' => $oficinaLogistica->id,
                'trabajador_id' => $trabajador1->id,
                'observaciones' => 'Impresora departamental conectada a red.',
            ],
            [
                'codigo_qr' => 'MARCONA-EQ-004',
                'codigo_patrimonial' => '740877000004',
                'tipo_gestion' => 'ACTIVO_UNICO',
                'nombre' => 'Mouse Inalámbrico Logitech MX Master 3S',
                'categoria' => 'Accesorios Informáticos',
                'marca' => 'Logitech',
                'modelo' => 'MX Master 3S',
                'numero_serie' => '2234LZ09AA8',
                'estado_conservacion' => 'BUENO',
                'oficina_id' => $oficinaLogistica->id,
                'trabajador_id' => $trabajador1->id,
                'observaciones' => 'Periférico ergonómico de precisión.',
            ],
        ];

        foreach ($bienesData as $bienItem) {
            Bien::firstOrCreate(
                ['codigo_qr' => $bienItem['codigo_qr']],
                $bienItem
            );
        }
    }
}
