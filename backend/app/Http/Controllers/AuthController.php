<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new citizen user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
            'tenant_code' => 'required|string|exists:tenants,code',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'is_senior_citizen' => 'nullable|boolean',
            'is_pwd' => 'nullable|boolean',
            'is_low_income' => 'nullable|boolean',
        ]);

        $tenant = Tenant::where('code', $validated['tenant_code'])->firstOrFail();

        if (!$tenant->is_active) {
            return response()->json([
                'message' => 'This barangay is currently not accepting registrations.'
            ], 422);
        }

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'citizen',
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'is_senior_citizen' => $validated['is_senior_citizen'] ?? false,
            'is_pwd' => $validated['is_pwd'] ?? false,
            'is_low_income' => $validated['is_low_income'] ?? false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user->load('tenant'),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Login an existing user.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($validated)) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        // Check if tenant is active (for non-super-admins)
        if ($user->role !== 'super_admin' && $user->tenant && !$user->tenant->is_active) {
            return response()->json([
                'message' => 'Your barangay account has been deactivated.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->load('tenant'),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout the current user (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('tenant'),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'is_senior_citizen' => 'nullable|boolean',
            'is_pwd' => 'nullable|boolean',
            'is_low_income' => 'nullable|boolean',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $request->user()->fresh()->load('tenant'),
        ]);
    }
}
