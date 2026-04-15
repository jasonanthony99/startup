<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DocumentRequestController;
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
Route::get('/applications/track-search', [ApplicationController::class, 'trackSearch']);

// Public assistance types (for tracking dropdown)
Route::get('/public/assistance-types', [ApplicationController::class, 'publicAssistanceTypes']);

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
    Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

    // Chat & Live Support
    Route::post('/chat', [ChatController::class, 'processMessage']);
    Route::get('/chat/history', [ChatController::class, 'fetchHistory']);
    Route::post('/chat/message', [ChatController::class, 'sendLiveMessage']);
    Route::get('/chat/unread-count', [ChatController::class, 'getUnreadCounts']);

    // Assistance types (for dropdown menus)
    Route::get('/assistance-types', [ApplicationController::class, 'assistanceTypes']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/clear-all', [NotificationController::class, 'clearAll']);
    });

    // ─── Citizen Routes ────────────────────────────────────────────────────
    Route::middleware('role:citizen,barangay_admin,super_admin')->group(function () {
        Route::get('/applications', [ApplicationController::class, 'index']);
        Route::post('/applications', [ApplicationController::class, 'store']);
        Route::get('/applications/{id}', [ApplicationController::class, 'show']);

        // Document Requests (Citizen)
        Route::get('/document-types', [DocumentRequestController::class, 'documentTypes']);
        Route::get('/document-requests', [DocumentRequestController::class, 'index']);
        Route::post('/document-requests', [DocumentRequestController::class, 'store']);
        Route::post('/document-requests/{id}/pay', [DocumentRequestController::class, 'simulatePayment']);
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
        Route::get('/admin/assistance-types', [AdminController::class, 'assistanceTypes']);
        Route::post('/admin/assistance-types', [AdminController::class, 'storeAssistanceType']);
        Route::put('/admin/assistance-types/{id}', [AdminController::class, 'updateAssistanceType']);
        
        // User Management
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::put('/admin/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::get('/admin/users/{id}/applications', [AdminController::class, 'userApplicationHistory']);

        // Chat Management
        Route::get('/admin/chat/sessions', [ChatController::class, 'getSessions']);
        Route::get('/admin/chat/{userId}/history', [ChatController::class, 'fetchAdminHistory']);
        Route::post('/admin/chat/{userId}/message', [ChatController::class, 'sendAdminMessage']);
        Route::get('/admin/chat/unread-count', [ChatController::class, 'getUnreadCounts']);

        // Document Type Management (Admin)
        Route::get('/admin/document-types', [DocumentRequestController::class, 'adminDocumentTypes']);
        Route::post('/admin/document-types', [DocumentRequestController::class, 'storeDocumentType']);
        Route::put('/admin/document-types/{id}', [DocumentRequestController::class, 'updateDocumentType']);

        // Document Request Management (Admin)
        Route::put('/admin/document-requests/{id}/status', [DocumentRequestController::class, 'updateStatus']);

        // Subscription (Admin)
        Route::post('/admin/subscribe', [\App\Http\Controllers\SubscriptionController::class, 'subscribe']);
    });

    // ─── Super Admin Routes ────────────────────────────────────────────────
    Route::middleware('role:super_admin')->prefix('tenants')->group(function () {
        Route::get('/', [TenantController::class, 'index']);
        Route::post('/', [TenantController::class, 'store']);
        Route::get('/{id}', [TenantController::class, 'show']);
        Route::get('/{id}/subscription-history', [TenantController::class, 'subscriptionHistory']);
        Route::put('/{id}', [TenantController::class, 'update']);
        Route::delete('/{id}', [TenantController::class, 'destroy']);
    });
});
