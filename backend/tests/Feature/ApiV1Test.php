<?php

namespace Tests\Feature;

use App\Models\Bien;
use App\Models\Oficina;
use App\Models\Trabajador;
use App\Models\User;
use Database\Seeders\MarconaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApiV1Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MarconaSeeder::class);
    }

    public function test_health_check_returns_success(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'UP',
                ],
            ]);
    }

    public function test_user_can_login_with_dni(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => '10000001',
            'password' => 'password',
            'device_name' => 'Automated Test',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Autenticación exitosa.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'dni', 'rol'],
                ],
            ]);
    }

    public function test_authenticated_user_can_access_me_profile(): void
    {
        $user = User::where('dni', '10000001')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dni' => '10000001',
                    'rol' => 'ADMIN',
                ],
            ]);
    }

    public function test_can_list_oficinas(): void
    {
        $user = User::where('dni', '10000001')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/oficinas');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(4, 'data');
    }

    public function test_can_list_and_search_trabajadores(): void
    {
        $user = User::where('dni', '10000001')->first();

        // Lista completa
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/trabajadores');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'data');

        // Búsqueda por nombre o dni
        $searchResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/trabajadores?search=Mendoza');

        $searchResponse->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(1, 'data');
    }

    public function test_can_create_trabajador(): void
    {
        $user = User::where('dni', '10000001')->first();
        $oficina = Oficina::first();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/trabajadores', [
                'dni' => '87654321',
                'nombre_completo' => 'Lic. Pedro Salazar',
                'cargo' => 'Asistente Administrativo',
                'oficina_id' => $oficina->id,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dni' => '87654321',
                    'nombre_completo' => 'Lic. Pedro Salazar',
                ],
            ]);
    }

    public function test_can_search_bien_by_qr_with_otros_bienes_vinculados(): void
    {
        $user = User::where('dni', '10000001')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/bienes/qr/MARCONA-EQ-001');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'codigo_qr' => 'MARCONA-EQ-001',
                    'nombre' => 'Laptop Lenovo ThinkPad T14 Gen 3',
                    'estado_inventario_actual' => 'PENDIENTE',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'otros_bienes_vinculados',
                    'oficina',
                    'trabajador',
                ],
            ]);

        // Los otros 3 bienes asignados al mismo trabajador deben estar en la lista
        $this->assertCount(3, $response->json('data.otros_bienes_vinculados'));
    }

    public function test_can_filter_bienes_by_search_oficina_and_estado_inventario(): void
    {
        $user = User::where('dni', '10000001')->first();
        $oficina = Oficina::where('sigla', 'LOG')->first();

        // Filtro por search
        $resSearch = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/bienes?search=ThinkPad');
        $resSearch->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($resSearch->json('data.items')));

        // Filtro por oficina
        $resOficina = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/bienes?oficina_id={$oficina->id}");
        $resOficina->assertStatus(200);
        $this->assertCount(4, $resOficina->json('data.items'));

        // Filtro por estado_inventario
        $resPendientes = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/bienes?estado_inventario=PENDIENTE');
        $resPendientes->assertStatus(200);
        $this->assertCount(4, $resPendientes->json('data.items'));
    }

    public function test_can_link_kit_to_trabajador(): void
    {
        $user = User::where('dni', '10000001')->first();
        $trabajador = Trabajador::first();
        $bienes = Bien::take(2)->pluck('id')->toArray();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/kits/vincular', [
                'trabajador_id' => $trabajador->id,
                'bienes_ids' => $bienes,
                'motivo' => 'Kit de prueba',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trabajador_id' => $trabajador->id,
                    'total_vinculados' => 2,
                ],
            ]);
    }

    public function test_campana_activa_returns_summary_and_escaneos_recientes(): void
    {
        $user = User::where('dni', '10000001')->first();
        $bien = Bien::first();

        // Registrar una verificación
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/verificaciones', [
                'campana_id' => 1,
                'bien_id' => $bien->id,
                'estado_verificado' => 'CONFORME',
                'observacion' => 'Equipo auditado',
            ])->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/campanas/activa');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'nombre' => 'Inventario Físico 2026',
                    'total_bienes' => 4,
                    'inventariados' => 1,
                    'pendientes' => 3,
                    'faltantes' => 0,
                    'porcentaje_avance' => 25,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'escaneos_recientes',
                ],
            ]);

        $this->assertCount(1, $response->json('data.escaneos_recientes'));
    }

    public function test_can_upload_foto_to_bien(): void
    {
        Storage::fake('public');
        $user = User::where('dni', '10000001')->first();
        $bien = Bien::first();

        $file = UploadedFile::fake()->image('laptop.jpg', 600, 600);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/bienes/{$bien->id}/foto", [
                'foto' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'foto_url',
                    'bien',
                ],
            ]);

        $bien->refresh();
        $this->assertNotNull($bien->foto_url);
    }
}
