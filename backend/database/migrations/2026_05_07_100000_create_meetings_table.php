<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('requests')->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('responsible_lawyer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('meeting_type', 16);
            $table->string('status', 16)->default('pending');
            $table->timestamp('start_at');
            $table->timestamp('end_at');
            $table->string('location', 512)->nullable();
            $table->string('meeting_link', 1024)->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->boolean('confirmed_by_client')->default(false);
            $table->timestamps();

            $table->index(['responsible_lawyer_id', 'start_at', 'end_at']);
            $table->index(['request_id', 'status']);
            $table->index('start_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
