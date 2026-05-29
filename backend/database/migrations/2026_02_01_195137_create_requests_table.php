<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('client_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('lawyer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('subject')->nullable();

            $table->text('message');

            $table->enum('status', [
                'new',
                'reviewing',
                'in_progress',
                'closed',
                'rejected',
            ])->default('new');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};
