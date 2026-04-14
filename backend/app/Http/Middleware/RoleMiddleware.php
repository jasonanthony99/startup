<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('role:super_admin,barangay_admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!in_array(auth()->user()->role, $roles)) {
            return response()->json(['message' => 'Unauthorized. Insufficient role permissions.'], 403);
        }

        return $next($request);
    }
}
