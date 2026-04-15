<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('name'); // e.g., "Barangay Clearance"
            $table->text('description')->nullable();
            $table->decimal('fee', 10, 2)->default(0);
            $table->text('requirements')->nullable(); // e.g., "Valid ID, 1x1 Photo"
            $table->string('processing_time')->default('1-3 business days');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
