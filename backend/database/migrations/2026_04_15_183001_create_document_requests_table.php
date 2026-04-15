<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('document_type_id')->constrained('document_types')->onDelete('cascade');
            $table->string('reference_id')->unique();
            $table->string('purpose')->nullable();
            $table->enum('status', ['pending_payment', 'paid', 'processing', 'ready', 'released', 'rejected'])->default('pending_payment');
            $table->enum('payment_method', ['gcash', 'paymaya', 'cash'])->nullable();
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('payment_reference')->nullable(); // Simulated transaction ID
            $table->date('pickup_date')->nullable();
            $table->text('admin_remarks')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_requests');
    }
};
