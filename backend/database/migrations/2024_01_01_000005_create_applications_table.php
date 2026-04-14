<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assistance_type_id')->constrained('assistance_types')->onDelete('cascade');
            $table->string('reference_id')->unique();
            $table->text('purpose')->nullable();
            $table->string('requirements_path')->nullable();
            $table->enum('status', ['pending', 'under_review', 'approved', 'released', 'rejected'])->default('pending');
            $table->integer('priority_level')->default(3);
            $table->integer('queue_position')->nullable();
            $table->text('admin_remarks')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'queue_position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
