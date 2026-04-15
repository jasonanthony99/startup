<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    /**
     * Simulate payment to subscribe the tenant to the premium plan.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:gcash,paymaya',
            'plan' => 'required|in:monthly,yearly',
        ]);

        $user = $request->user();
        
        // Ensure only admins can subscribe the barangay
        if ($user->role !== 'barangay_admin' && $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $tenant = Tenant::findOrFail($user->tenant_id);

        if ($tenant->is_subscribed) {
            return response()->json(['message' => 'Barangay is already subscribed.'], 400);
        }

        $now = now();
        $expires = $validated['plan'] === 'yearly' ? $now->copy()->addYear() : $now->copy()->addMonth();
        $amount = $validated['plan'] === 'yearly' ? 9990.00 : 999.00;

        // Update Tenant plan
        $tenant->update([
            'subscription_plan' => $validated['plan'],
            'subscription_expires_at' => $expires,
        ]);

        // Generate fake reference
        $paymentRef = strtoupper($validated['payment_method']) . '-SUB-' . $now->format('YmdHis');

        // Log payment
        \App\Models\SubscriptionPayment::create([
            'tenant_id' => $tenant->id,
            'plan' => $validated['plan'],
            'amount' => $amount,
            'payment_method' => $validated['payment_method'],
            'reference_id' => $paymentRef,
            'starts_at' => $now,
            'expires_at' => $expires,
        ]);

        return response()->json([
            'message' => 'Subscription successful! Premium features unlocked.',
            'payment_reference' => $paymentRef,
            'tenant' => $tenant
        ]);
    }
}
