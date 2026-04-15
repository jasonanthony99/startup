<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('is_subscribed');
            $table->enum('subscription_plan', ['free', 'monthly', 'yearly'])->default('free')->after('is_active');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_plan');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('subscription_plan');
            $table->dropColumn('subscription_expires_at');
            $table->boolean('is_subscribed')->default(false)->after('is_active');
        });
    }
};
