<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Ensure the authenticated user belongs to an active tenant.
     * Super admins bypass this check.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = auth()->user();

        // Super admins don't need a tenant
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Ensure user has a tenant
        if (!$user->tenant_id) {
            return response()->json(['message' => 'No barangay assigned to this account.'], 403);
        }

        // Ensure tenant is active
        $tenant = $user->tenant;
        if (!$tenant || !$tenant->is_active) {
            return response()->json(['message' => 'Your barangay account has been deactivated.'], 403);
        }

        return $next($request);
    }
}
