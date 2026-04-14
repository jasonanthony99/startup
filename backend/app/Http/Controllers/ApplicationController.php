<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\AssistanceType;
use App\Models\Notification;
use App\Models\StatusLog;
use App\Services\PriorityCalculator;
use App\Services\QueueManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    protected PriorityCalculator $priorityCalculator;
    protected QueueManager $queueManager;

    public function __construct(PriorityCalculator $priorityCalculator, QueueManager $queueManager)
    {
        $this->priorityCalculator = $priorityCalculator;
        $this->queueManager = $queueManager;
    }

    /**
     * List applications for the current user.
     * Admins see all applications in their tenant.
     * Citizens see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['user', 'assistanceType', 'priorityScore']);

        // Citizens can only see their own applications
        if ($request->user()->role === 'citizen') {
            $query->where('user_id', $request->user()->id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by reference ID or name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $applications = $query->paginate($request->get('per_page', 15));

        return response()->json($applications);
    }

    /**
     * Submit a new assistance application.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assistance_type_id' => 'required|exists:assistance_types,id',
            'purpose' => 'required|string|max:1000',
            'requirements' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $user = $request->user();

        // Generate unique reference ID
        $referenceId = Application::generateReferenceId($user->tenant_id);

        // Handle file upload
        $requirementsPath = null;
        if ($request->hasFile('requirements')) {
            $requirementsPath = $request->file('requirements')->store(
                "tenants/{$user->tenant_id}/requirements",
                'local'
            );
        }

        $application = Application::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'assistance_type_id' => $validated['assistance_type_id'],
            'reference_id' => $referenceId,
            'purpose' => $validated['purpose'],
            'requirements_path' => $requirementsPath,
            'status' => 'pending',
        ]);

        // Calculate priority score
        $this->priorityCalculator->calculate($application);

        // Log initial status
        StatusLog::create([
            'application_id' => $application->id,
            'changed_by' => $user->id,
            'from_status' => null,
            'to_status' => 'pending',
            'remarks' => 'Application submitted.',
        ]);

        // Create notification
        Notification::create([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'title' => 'Application Submitted',
            'message' => "Your application {$referenceId} has been submitted successfully and is pending review.",
            'type' => 'status_update',
        ]);

        return response()->json([
            'message' => 'Application submitted successfully.',
            'application' => $application->load(['assistanceType', 'priorityScore', 'statusLogs']),
        ], 201);
    }

    /**
     * Get a specific application.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $application = Application::with(['user', 'assistanceType', 'priorityScore', 'statusLogs.changedByUser', 'reviewer'])
            ->findOrFail($id);

        // Citizens can only see their own
        if ($request->user()->role === 'citizen' && $application->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json(['application' => $application]);
    }

    /**
     * Track application by reference ID (public endpoint).
     */
    public function track(string $referenceId): JsonResponse
    {
        $application = Application::withoutGlobalScopes()
            ->with(['assistanceType', 'statusLogs'])
            ->where('reference_id', $referenceId)
            ->first();

        if (!$application) {
            return response()->json(['message' => 'Application not found.'], 404);
        }

        // Return limited info for public tracking
        return response()->json([
            'application' => [
                'reference_id' => $application->reference_id,
                'status' => $application->status,
                'priority_level' => $application->priority_level,
                'queue_position' => $application->queue_position,
                'assistance_type' => $application->assistanceType->name,
                'submitted_at' => $application->created_at,
                'reviewed_at' => $application->reviewed_at,
                'status_history' => $application->statusLogs->map(function ($log) {
                    return [
                        'from' => $log->from_status,
                        'to' => $log->to_status,
                        'remarks' => $log->remarks,
                        'date' => $log->created_at,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Update application status (Admin only).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:under_review,approved,released,rejected',
            'remarks' => 'nullable|string|max:500',
        ]);

        $application = Application::with('user')->findOrFail($id);
        $oldStatus = $application->status;

        // Update status
        $application->update([
            'status' => $validated['status'],
            'admin_remarks' => $validated['remarks'] ?? $application->admin_remarks,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        // Handle queue operations
        if ($validated['status'] === 'approved') {
            $this->queueManager->assignPosition($application);
        } elseif (in_array($validated['status'], ['released', 'rejected'])) {
            $this->queueManager->removeFromQueue($application);
        }

        // Log status change
        StatusLog::create([
            'application_id' => $application->id,
            'changed_by' => $request->user()->id,
            'from_status' => $oldStatus,
            'to_status' => $validated['status'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        // Notify the citizen
        $statusLabels = [
            'under_review' => 'Under Review',
            'approved' => 'Approved',
            'released' => 'Released',
            'rejected' => 'Rejected',
        ];

        Notification::create([
            'user_id' => $application->user_id,
            'tenant_id' => $application->tenant_id,
            'title' => "Application {$statusLabels[$validated['status']]}",
            'message' => "Your application {$application->reference_id} has been updated to: {$statusLabels[$validated['status']]}." .
                ($validated['remarks'] ? " Remarks: {$validated['remarks']}" : ''),
            'type' => 'status_update',
        ]);

        return response()->json([
            'message' => 'Application status updated.',
            'application' => $application->fresh()->load(['user', 'assistanceType', 'priorityScore', 'statusLogs']),
        ]);
    }

    /**
     * Get assistance types for the current tenant.
     */
    public function assistanceTypes(): JsonResponse
    {
        $types = AssistanceType::where('is_active', true)->get();

        return response()->json(['assistance_types' => $types]);
    }
}
