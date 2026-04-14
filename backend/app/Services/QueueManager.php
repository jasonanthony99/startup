<?php

namespace App\Services;

use App\Models\Application;

class QueueManager
{
    /**
     * Assign queue position to a newly approved application.
     * Position is based on priority level (lower = higher priority) and
     * then by creation date within the same priority level.
     */
    public function assignPosition(Application $application): void
    {
        $tenantId = $application->tenant_id;

        // Get the max queue position for the tenant's active queue
        $maxPosition = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'under_review'])
            ->whereNotNull('queue_position')
            ->max('queue_position') ?? 0;

        $application->update(['queue_position' => $maxPosition + 1]);

        // Re-sort the entire queue by priority
        $this->resortQueue($tenantId);
    }

    /**
     * Resort the queue for a tenant based on priority level and created_at.
     */
    public function resortQueue(int $tenantId): void
    {
        $applications = Application::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'under_review'])
            ->whereNotNull('queue_position')
            ->orderBy('priority_level', 'asc')  // Level 1 (HIGH) first
            ->orderBy('created_at', 'asc')       // FIFO within same priority
            ->get();

        $position = 1;
        foreach ($applications as $app) {
            $app->update(['queue_position' => $position]);
            $position++;
        }
    }

    /**
     * Update a specific application's queue position (manual override).
     */
    public function updatePosition(Application $application, int $newPosition): void
    {
        $tenantId = $application->tenant_id;
        $oldPosition = $application->queue_position;

        if ($oldPosition === $newPosition) {
            return;
        }

        // Shift other applications
        if ($newPosition < $oldPosition) {
            // Moving up: shift others down
            Application::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['approved', 'under_review'])
                ->whereBetween('queue_position', [$newPosition, $oldPosition - 1])
                ->increment('queue_position');
        } else {
            // Moving down: shift others up
            Application::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['approved', 'under_review'])
                ->whereBetween('queue_position', [$oldPosition + 1, $newPosition])
                ->decrement('queue_position');
        }

        $application->update(['queue_position' => $newPosition]);
    }

    /**
     * Remove application from queue (when released or rejected).
     */
    public function removeFromQueue(Application $application): void
    {
        $tenantId = $application->tenant_id;
        $position = $application->queue_position;

        if (!$position) {
            return;
        }

        // Shift all positions after this one up
        Application::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['approved', 'under_review'])
            ->where('queue_position', '>', $position)
            ->decrement('queue_position');

        $application->update(['queue_position' => null]);
    }
}
