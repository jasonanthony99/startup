<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use App\Models\DocumentRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DocumentRequestController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════
    //  DOCUMENT TYPES
    // ═══════════════════════════════════════════════════════════════════

    /**
     * List active document types for citizens.
     */
    public function documentTypes(): JsonResponse
    {
        $types = DocumentType::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['document_types' => $types]);
    }

    /**
     * Admin: List all document types.
     */
    public function adminDocumentTypes(): JsonResponse
    {
        $types = DocumentType::orderBy('name')->get();
        return response()->json(['document_types' => $types]);
    }

    /**
     * Admin: Create a new document type.
     */
    public function storeDocumentType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'fee' => 'required|numeric|min:0',
            'requirements' => 'nullable|string|max:1000',
            'processing_time' => 'nullable|string|max:100',
        ]);

        $type = DocumentType::create([
            ...$validated,
            'tenant_id' => $request->user()->tenant_id,
        ]);

        return response()->json(['document_type' => $type, 'message' => 'Document type created.'], 201);
    }

    /**
     * Admin: Update a document type.
     */
    public function updateDocumentType(Request $request, int $id): JsonResponse
    {
        $type = DocumentType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'fee' => 'sometimes|numeric|min:0',
            'requirements' => 'nullable|string|max:1000',
            'processing_time' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $type->update($validated);

        return response()->json(['document_type' => $type, 'message' => 'Document type updated.']);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  DOCUMENT REQUESTS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * List document requests.
     * Citizens see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentRequest::with(['user', 'documentType']);

        if ($request->user()->role === 'citizen') {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($requests);
    }

    /**
     * Citizen: Submit a new document request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_type_id' => 'required|exists:document_types,id',
            'purpose' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $docType = DocumentType::findOrFail($validated['document_type_id']);
        $referenceId = DocumentRequest::generateReferenceId($user->tenant_id);

        $docRequest = DocumentRequest::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'document_type_id' => $docType->id,
            'reference_id' => $referenceId,
            'purpose' => $validated['purpose'] ?? null,
            'status' => $docType->fee > 0 ? 'pending_payment' : 'processing',
            'payment_status' => $docType->fee > 0 ? 'unpaid' : 'paid',
            'amount' => $docType->fee,
        ]);

        // Notification for citizen
        Notification::create([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'title' => 'Document Request Submitted',
            'message' => "Your request for {$docType->name} ({$referenceId}) has been submitted." .
                ($docType->fee > 0 ? " Please complete payment of ₱{$docType->fee}." : ''),
            'type' => 'status_update',
            'redirect_url' => "/citizen/documents?highlight={$docRequest->id}",
        ]);

        // Notify admins
        $admins = User::where('tenant_id', $user->tenant_id)
            ->where('role', 'barangay_admin')
            ->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'tenant_id' => $user->tenant_id,
                'title' => 'New Document Request',
                'message' => "{$user->name} requested a {$docType->name} ({$referenceId}).",
                'type' => 'system',
                'redirect_url' => "/admin/document-requests?highlight={$docRequest->id}",
            ]);
        }

        return response()->json([
            'message' => 'Document request submitted.',
            'document_request' => $docRequest->load('documentType'),
        ], 201);
    }

    /**
     * Simulate online payment (GCash/Paymaya).
     */
    public function simulatePayment(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:gcash,paymaya',
        ]);

        $docRequest = DocumentRequest::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if ($docRequest->payment_status === 'paid') {
            return response()->json(['message' => 'Already paid.'], 400);
        }

        // Simulate payment — auto-approve
        $paymentRef = strtoupper($validated['payment_method']) . '-' . now()->format('YmdHis') . '-' . rand(1000, 9999);

        $docRequest->update([
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'paid',
            'payment_reference' => $paymentRef,
            'status' => 'processing',
            'paid_at' => now(),
        ]);

        // Notify citizen
        Notification::create([
            'user_id' => $request->user()->id,
            'tenant_id' => $request->user()->tenant_id,
            'title' => 'Payment Successful',
            'message' => "Payment of ₱{$docRequest->amount} for {$docRequest->reference_id} via " . strtoupper($validated['payment_method']) . " confirmed. Your document is now being processed.",
            'type' => 'status_update',
            'redirect_url' => "/citizen/documents?highlight={$docRequest->id}",
        ]);

        return response()->json([
            'message' => 'Payment simulated successfully.',
            'payment_reference' => $paymentRef,
            'document_request' => $docRequest->fresh()->load('documentType'),
        ]);
    }

    /**
     * Admin: Update document request status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:processing,ready,released,rejected',
            'remarks' => 'nullable|string|max:500',
            'pickup_date' => 'nullable|date',
        ]);

        $docRequest = DocumentRequest::with('documentType')->findOrFail($id);
        $oldStatus = $docRequest->status;

        $updateData = [
            'status' => $validated['status'],
            'admin_remarks' => $validated['remarks'] ?? $docRequest->admin_remarks,
        ];

        if ($validated['status'] === 'ready' && isset($validated['pickup_date'])) {
            $updateData['pickup_date'] = $validated['pickup_date'];
            $updateData['processed_at'] = now();
        }

        if ($validated['status'] === 'released') {
            $updateData['released_at'] = now();
        }

        $docRequest->update($updateData);

        // Status labels for notification
        $statusLabels = [
            'processing' => 'Being Processed',
            'ready' => 'Ready for Pickup',
            'released' => 'Released',
            'rejected' => 'Rejected',
        ];

        $message = "Your document request {$docRequest->reference_id} ({$docRequest->documentType->name}) is now: {$statusLabels[$validated['status']]}.";
        if ($validated['status'] === 'ready' && isset($validated['pickup_date'])) {
            $message .= " Pickup date: " . date('M d, Y', strtotime($validated['pickup_date'])) . ".";
        }
        if (!empty($validated['remarks'])) {
            $message .= " Remarks: {$validated['remarks']}";
        }

        Notification::create([
            'user_id' => $docRequest->user_id,
            'tenant_id' => $docRequest->tenant_id,
            'title' => "Document {$statusLabels[$validated['status']]}",
            'message' => $message,
            'type' => 'status_update',
            'redirect_url' => "/citizen/documents?highlight={$docRequest->id}",
        ]);

        return response()->json([
            'message' => 'Document request status updated.',
            'document_request' => $docRequest->fresh()->load(['user', 'documentType']),
        ]);
    }
}
