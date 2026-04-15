<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use App\Models\AssistanceType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    /**
     * List all tenants (super admin only).
     */
    public function index(): JsonResponse
    {
        $tenants = Tenant::withCount(['users', 'applications'])
            ->orderBy('name')
            ->get();

        return response()->json(['tenants' => $tenants]);
    }

    /**
     * Create a new tenant (barangay).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:tenants,code',
            'address' => 'nullable|string|max:500',
            'contact_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        // Create tenant
        $tenant = Tenant::create([
            'name' => $validated['name'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'code' => Str::upper($validated['code']),
            'address' => $validated['address'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'email' => $validated['email'] ?? null,
        ]);

        // Create barangay admin user
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['admin_name'],
            'email' => $validated['admin_email'],
            'password' => Hash::make($validated['admin_password']),
            'role' => 'barangay_admin',
        ]);

        // Seed default assistance types
        $defaultTypes = [
            ['name' => 'Medical Assistance', 'description' => 'Financial aid for medical needs, hospital bills, and medicines.'],
            ['name' => 'Financial Assistance', 'description' => 'General financial support for families in need.'],
            ['name' => 'Food Assistance', 'description' => 'Food packs and grocery support for families.'],
            ['name' => 'Educational Assistance', 'description' => 'Support for school supplies, tuition, and educational needs.'],
            ['name' => 'Burial Assistance', 'description' => 'Financial aid for burial and funeral expenses.'],
            ['name' => 'Disaster Relief', 'description' => 'Emergency assistance during natural disasters and calamities.'],
        ];

        foreach ($defaultTypes as $type) {
            AssistanceType::create([
                'tenant_id' => $tenant->id,
                'name' => $type['name'],
                'description' => $type['description'],
            ]);
        }

        return response()->json([
            'message' => 'Barangay created successfully with admin account and default assistance types.',
            'tenant' => $tenant->load('users'),
        ], 201);
    }

    /**
     * Show a specific tenant.
     */
    public function show(int $id): JsonResponse
    {
        $tenant = Tenant::withCount(['users', 'applications'])
            ->findOrFail($id);

        return response()->json(['tenant' => $tenant]);
    }

    /**
     * Update a tenant.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'province' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:500',
            'contact_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'sometimes|boolean',
            'subscription_plan' => 'sometimes|string|in:free,monthly,yearly',
            'subscription_expires_at' => 'nullable|date',
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->update($validated);

        return response()->json([
            'message' => 'Barangay updated successfully.',
            'tenant' => $tenant,
        ]);
    }

    /**
     * Show subscription history for a tenant.
     */
    public function subscriptionHistory(int $id): JsonResponse
    {
        $history = \App\Models\SubscriptionPayment::where('tenant_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['history' => $history]);
    }

    /**
     * Deactivate a tenant (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['is_active' => false]);

        return response()->json([
            'message' => 'Barangay deactivated successfully.',
        ]);
    }
}
