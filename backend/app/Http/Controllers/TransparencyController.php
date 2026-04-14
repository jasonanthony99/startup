<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TransparencyController extends Controller
{
    /**
     * Get public statistics for a barangay.
     */
    public function stats(string $tenantCode): JsonResponse
    {
        $tenant = Tenant::where('code', $tenantCode)->where('is_active', true)->first();

        if (!$tenant) {
            return response()->json(['message' => 'Barangay not found.'], 404);
        }

        $totalApplications = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)->count();

        $approved = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'approved')->count();

        $released = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'released')->count();

        $rejected = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'rejected')->count();

        $pending = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'pending')->count();

        $byType = Application::withoutGlobalScopes()
            ->where('applications.tenant_id', $tenant->id)
            ->join('assistance_types', 'applications.assistance_type_id', '=', 'assistance_types.id')
            ->select('assistance_types.name', DB::raw('COUNT(*) as count'))
            ->groupBy('assistance_types.name')
            ->get();

        return response()->json([
            'barangay' => [
                'name' => $tenant->name,
                'code' => $tenant->code,
            ],
            'stats' => [
                'total_applications' => $totalApplications,
                'approved' => $approved,
                'released' => $released,
                'rejected' => $rejected,
                'pending' => $pending,
                'approval_rate' => $totalApplications > 0
                    ? round((($approved + $released) / $totalApplications) * 100, 1)
                    : 0,
            ],
            'by_type' => $byType,
        ]);
    }

    /**
     * Get released assistance records (public).
     */
    public function released(Request $request, string $tenantCode): JsonResponse
    {
        $tenant = Tenant::where('code', $tenantCode)->where('is_active', true)->first();

        if (!$tenant) {
            return response()->json(['message' => 'Barangay not found.'], 404);
        }

        $released = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'released')
            ->with('assistanceType')
            ->select('id', 'reference_id', 'assistance_type_id', 'status', 'reviewed_at', 'created_at')
            ->orderBy('reviewed_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($released);
    }

    /**
     * Get monthly summary for transparency charts.
     */
    public function monthlySummary(string $tenantCode): JsonResponse
    {
        $tenant = Tenant::where('code', $tenantCode)->where('is_active', true)->first();

        if (!$tenant) {
            return response()->json(['message' => 'Barangay not found.'], 404);
        }

        $monthly = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('created_at', '>=', now()->subMonths(12))
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status IN ("approved", "released") THEN 1 ELSE 0 END) as approved_count'),
                DB::raw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected_count'),
                DB::raw('SUM(CASE WHEN status = "released" THEN 1 ELSE 0 END) as released_count')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        return response()->json([
            'barangay' => $tenant->name,
            'monthly_data' => $monthly,
        ]);
    }

    /**
     * Get list of active barangays (for landing page).
     */
    public function barangayList(): JsonResponse
    {
        $tenants = Tenant::where('is_active', true)
            ->select('id', 'name', 'code', 'address')
            ->get();

        return response()->json(['barangays' => $tenants]);
    }
}
