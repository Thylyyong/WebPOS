<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

class RoleAndProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected User $boss;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        // Find or create Boss user
        $this->boss = User::where('role', 'BOSS')->orWhere('username', 'boss')->first();
        if (!$this->boss) {
            $this->boss = User::create([
                'name' => 'Boss Test',
                'username' => 'boss_test',
                'pin_code' => '9999',
                'role' => 'BOSS',
                'branch_id' => 'store_main',
                'is_active' => true,
            ]);
        }
    }

    public function test_boss_can_view_and_create_custom_role(): void
    {
        Sanctum::actingAs($this->boss);

        // 1. Get roles
        $response = $this->getJson('/api/admin/roles');
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // 2. Create custom role
        $createResponse = $this->postJson('/api/admin/roles', [
            'name' => 'Master Barista',
            'code' => 'BARISTA_' . time(),
            'description' => 'Coffee artisan with drink queue access',
            'permissions' => ['pos', 'tables'],
        ]);

        $createResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'role' => [
                    'name' => 'Master Barista',
                ],
            ]);
    }

    public function test_boss_can_create_staff_and_login_with_new_role(): void
    {
        Sanctum::actingAs($this->boss);

        $testUsername = 'barista_' . time();
        $testPin = '7890';

        // 1. Create staff member
        $staffResponse = $this->postJson('/api/admin/staff', [
            'name' => 'Sam Barista',
            'username' => $testUsername,
            'pin_code' => $testPin,
            'role' => 'BARISTA',
            'branch_id' => 'store_main',
        ]);

        $staffResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'staff' => [
                    'username' => $testUsername,
                    'role' => 'BARISTA',
                ],
            ]);

        // 2. Check that public /api/auth/roles returns new staff profile for splash screen
        $publicRoles = $this->getJson('/api/auth/roles');
        $publicRoles->assertStatus(200);
        $rolesList = $publicRoles->json('roles');
        $found = collect($rolesList)->firstWhere('username', $testUsername);
        $this->assertNotNull($found, 'New staff profile must appear on splash screen');

        // 3. Login with PIN as newly created staff member
        $loginResponse = $this->postJson('/api/auth/login-pin', [
            'username' => $testUsername,
            'pin_code' => $testPin,
        ]);

        $loginResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Authentication successful',
                'user' => [
                    'username' => $testUsername,
                    'role' => 'BARISTA',
                ],
            ]);
        $this->assertNotEmpty($loginResponse->json('token'));
    }

    public function test_product_image_upload_and_full_crud(): void
    {
        Sanctum::actingAs($this->boss);

        $category = Category::first();
        $this->assertNotNull($category, 'Database must have at least one category');

        // 1. Upload standalone image
        $fakeImage = UploadedFile::fake()->create('mocha_latte.jpg', 100, 'image/jpeg');
        $uploadRes = $this->postJson('/api/catalog/upload-image', [
            'image' => $fakeImage,
        ]);

        $uploadRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
        $uploadedPath = $uploadRes->json('image_path');
        $uploadedUrl = $uploadRes->json('image_url');
        $this->assertNotEmpty($uploadedPath);
        $this->assertNotEmpty($uploadedUrl);

        // 2. Create product with direct image file upload
        $fakeProdImage = UploadedFile::fake()->create('special_burger.png', 200, 'image/png');
        $createRes = $this->post('/api/catalog/products', [
            'name' => 'Signature Truffle Croissant',
            'category_id' => $category->id,
            'price' => 6.50,
            'cost' => 1.80,
            'sku' => 'BAK-' . time(),
            'barcode' => (string)rand(100000, 999999),
            'stock_quantity' => 45,
            'tax_rate' => 10.0,
            'image' => $fakeProdImage,
        ]);

        $createRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'product' => [
                    'name' => 'Signature Truffle Croissant',
                    'price' => 6.50,
                ],
            ]);

        $prodId = $createRes->json('product.id');
        $prodImageUrl = $createRes->json('product.image_url');
        $this->assertNotEmpty($prodId);
        $this->assertNotNull($prodImageUrl);

        // 3. Edit product price and stock
        $updateRes = $this->post("/api/catalog/products/{$prodId}", [
            'name' => 'Signature Truffle Croissant Deluxe',
            'price' => 7.25,
            'stock_quantity' => 60,
        ]);

        $updateRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'product' => [
                    'name' => 'Signature Truffle Croissant Deluxe',
                    'price' => 7.25,
                    'stock_quantity' => 60,
                ],
            ]);

        // 4. Delete product
        $deleteRes = $this->deleteJson("/api/catalog/products/{$prodId}");
        $deleteRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('products', ['id' => $prodId]);
    }
}
