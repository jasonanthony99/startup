<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Services\QueueManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QueueController extends Controller
{
    protected QueueManager $queueManager;

    public function __construct(QueueManager $queueManager)
    {
        $this->queueManager = $queueManager;
    }

    /**
     * Get the current queue for the admin's tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with(['user', 'assistanceType', 'priorityScore'])
            ->whereIn('status', ['under_review', 'approved'])
            ->whereNotNull('queue_position')
            ->orderBy('queue_position', 'asc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $queue = $query->get();

        return response()->json([
            'queue' => $queue,
            'total' => $queue->count(),
        ]);
    }

    /**
     * Update a specific application's queue position.
     */
    public function updatePosition(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'position' => 'required|integer|min:1',
        ]);

        $application = Application::findOrFail($id);

        if (!$application->queue_position) {
            return response()->json(['message' => 'Application is not in the queue.'], 422);
        }

        $this->queueManager->updatePosition($application, $validated['position']);

        return response()->json([
            'message' => 'Queue position updated.',
            'application' => $application->fresh()->load(['user', 'assistanceType']),
        ]);
    }

    /**
     * Get the next application in queue.
     */
    public function next(): JsonResponse
    {
        $next = Application::with(['user', 'assistanceType', 'priorityScore'])
            ->where('status', 'approved')
            ->whereNotNull('queue_position')
            ->orderBy('queue_position', 'asc')
            ->first();

        if (!$next) {
            return response()->json(['message' => 'Queue is empty.', 'application' => null]);
        }

        return response()->json(['application' => $next]);
    }

    /**
     * Resort the entire queue based on priority.
     */
    public function resort(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $this->queueManager->resortQueue($tenantId);

        return response()->json(['message' => 'Queue has been re-sorted by priority.']);
    }
}
