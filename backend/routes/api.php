<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\TransparencyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Public Routes ─────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public application tracking
Route::get('/applications/track/{referenceId}', [ApplicationController::class, 'track']);

// Public transparency endpoints
Route::prefix('transparency')->group(function () {
    Route::get('/barangays', [TransparencyController::class, 'barangayList']);
    Route::get('/{tenantCode}/stats', [TransparencyController::class, 'stats']);
    Route::get('/{tenantCode}/released', [TransparencyController::class, 'released']);
    Route::get('/{tenantCode}/monthly', [TransparencyController::class, 'monthlySummary']);
});

// ─── Authenticated Routes ──────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Assistance types (for dropdown menus)
    Route::get('/assistance-types', [ApplicationController::class, 'assistanceTypes']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // ─── Citizen Routes ────────────────────────────────────────────────────
    Route::middleware('role:citizen,barangay_admin,super_admin')->group(function () {
        Route::get('/applications', [ApplicationController::class, 'index']);
        Route::post('/applications', [ApplicationController::class, 'store']);
        Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    });

    // ─── Admin Routes ──────────────────────────────────────────────────────
    Route::middleware('role:barangay_admin,super_admin')->group(function () {
        // Application status management
        Route::put('/applications/{id}/status', [ApplicationController::class, 'updateStatus']);

        // Queue management
        Route::prefix('queue')->group(function () {
            Route::get('/', [QueueController::class, 'index']);
            Route::put('/{id}/position', [QueueController::class, 'updatePosition']);
            Route::get('/next', [QueueController::class, 'next']);
            Route::post('/resort', [QueueController::class, 'resort']);
        });

        // Admin dashboard & reports
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/reports', [AdminController::class, 'reports']);
        Route::get('/admin/reports/monthly', [AdminController::class, 'monthlySummary']);

        // Assistance type management
        Route::post('/admin/assistance-types', [AdminController::class, 'storeAssistanceType']);
        Route::put('/admin/assistance-types/{id}', [AdminController::class, 'updateAssistanceType']);
    });

    // ─── Super Admin Routes ────────────────────────────────────────────────
    Route::middleware('role:super_admin')->prefix('tenants')->group(function () {
        Route::get('/', [TenantController::class, 'index']);
        Route::post('/', [TenantController::class, 'store']);
        Route::get('/{id}', [TenantController::class, 'show']);
        Route::put('/{id}', [TenantController::class, 'update']);
        Route::delete('/{id}', [TenantController::class, 'destroy']);
    });
});
