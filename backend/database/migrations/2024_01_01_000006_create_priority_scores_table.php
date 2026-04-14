<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('priority_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->onDelete('cascade');
            $table->boolean('is_senior')->default(false);
            $table->boolean('is_pwd')->default(false);
            $table->boolean('is_low_income')->default(false);
            $table->integer('age_score')->default(0);
            $table->integer('total_score')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('priority_scores');
    }
};
