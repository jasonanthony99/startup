<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\AssistanceType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics for the admin's tenant.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        // If super admin, get overall stats
        $query = Application::query();
        if ($request->user()->role === 'super_admin') {
            $query = Application::withoutGlobalScopes();
        }

        $totalApplications = (clone $query)->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $underReview = (clone $query)->where('status', 'under_review')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $released = (clone $query)->where('status', 'released')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();

        $citizenQuery = User::query();
        if ($request->user()->role !== 'super_admin') {
            $citizenQuery->where('tenant_id', $tenantId);
        }
        $totalCitizens = $citizenQuery->where('role', 'citizen')->count();

        // Super Admin Specific: Total Barangays
        $totalTenants = 0;
        if ($request->user()->role === 'super_admin') {
            $totalTenants = \App\Models\Tenant::count();
        }

        // Recent applications (Only for Barangay Admins)
        $recentApplications = [];
        if ($request->user()->role !== 'super_admin') {
            $recentApplications = Application::with(['user', 'assistanceType'])
                ->where('tenant_id', $tenantId)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        }

        // Monthly trend (last 6 months)
        $monthlyQuery = Application::query();
        if ($request->user()->role === 'super_admin') {
            $monthlyQuery = Application::withoutGlobalScopes();
        }
        $monthlyTrend = $monthlyQuery
            ->where('created_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "approved" OR status = "released" THEN 1 ELSE 0 END) as approved_count'),
                DB::raw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected_count')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Assistance type breakdown
        $typeQuery = Application::query();
        if ($request->user()->role === 'super_admin') {
            $typeQuery = Application::withoutGlobalScopes();
        }
        $byType = $typeQuery
            ->join('assistance_types', 'applications.assistance_type_id', '=', 'assistance_types.id')
            ->select('assistance_types.name', DB::raw('COUNT(*) as count'))
            ->groupBy('assistance_types.name')
            ->get();

        return response()->json([
            'stats' => [
                'total_applications' => $totalApplications,
                'pending' => $pending,
                'under_review' => $underReview,
                'approved' => $approved,
                'released' => $released,
                'rejected' => $rejected,
                'total_citizens' => $totalCitizens,
                'total_barangays' => $totalTenants,
            ],
            'recent_applications' => $recentApplications,
            'monthly_trend' => $monthlyTrend,
            'by_type' => $byType,
        ]);
    }

    /**
     * Get all assistance types for the admin's tenant.
     */
    public function assistanceTypes(Request $request): JsonResponse
    {
        $types = AssistanceType::orderBy('name')->get();

        return response()->json(['assistance_types' => $types]);
    }

    public function reports(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,under_review,approved,released,rejected',
            'assistance_type_id' => 'nullable|exists:assistance_types,id',
        ]);

        $query = Application::with(['user', 'assistanceType', 'priorityScore']);

        if (!empty($validated['start_date'])) {
            $query->where('created_at', '>=', $validated['start_date']);
        }
        if (!empty($validated['end_date'])) {
            $query->where('created_at', '<=', $validated['end_date'] . ' 23:59:59');
        }
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (!empty($validated['assistance_type_id'])) {
            $query->where('assistance_type_id', $validated['assistance_type_id']);
        }

        $applications = $query->orderBy('created_at', 'desc')->get();

        // Summary stats
        $summary = [
            'total' => $applications->count(),
            'by_status' => $applications->groupBy('status')->map->count(),
            'by_priority' => $applications->groupBy('priority_level')->map->count(),
            'by_type' => $applications->groupBy(fn($app) => $app->assistanceType->name ?? 'Unknown')->map->count(),
        ];

        return response()->json([
            'applications' => $applications,
            'summary' => $summary,
        ]);
    }

    /**
     * Monthly summary report.
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        $year = $request->get('year', now()->year);

        $query = Application::query();
        if ($request->user()->role === 'super_admin') {
            $query = Application::withoutGlobalScopes();
        }

        $monthly = $query
            ->whereYear('created_at', $year)
            ->select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN status = "released" THEN 1 ELSE 0 END) as released'),
                DB::raw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected'),
                DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'year' => $year,
            'monthly_data' => $monthly,
        ]);
    }

    /**
     * Manage assistance types (CRUD).
     */
    public function storeAssistanceType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $type = AssistanceType::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Assistance type created.',
            'assistance_type' => $type,
        ], 201);
    }

    public function updateAssistanceType(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
        ]);

        $type = AssistanceType::findOrFail($id);
        $type->update($validated);

        return response()->json([
            'message' => 'Assistance type updated.',
            'assistance_type' => $type,
        ]);
    }

    /**
     * List all users for the admin's tenant.
     */
    public function users(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $users = User::where('tenant_id', $tenantId)
            ->where('id', '!=', $request->user()->id) // Don't list self if you want to prevent self-role edits here
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }

    /**
     * Update user role.
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:citizen,barangay_admin',
        ]);

        $user = User::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'message' => "User role updated to {$validated['role']}.",
            'user' => $user
        ]);
    }

    /**
     * Get application history for a specific user.
     */
    public function userApplicationHistory(Request $request, int $id): JsonResponse
    {
        // Ensure user belongs to same tenant
        $user = User::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $applications = Application::where('user_id', $id)
            ->with('assistanceType')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'user' => $user,
            'applications' => $applications
        ]);
    }
}
