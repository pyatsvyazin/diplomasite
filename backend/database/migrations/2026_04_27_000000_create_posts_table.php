<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->json('content');
            $table->text('excerpt')->nullable();
            $table->string('cover_image_url', 1024)->nullable();
            $table->string('cover_color', 16)->nullable();
            $table->json('keywords')->nullable();
            $table->string('type', 32);
            $table->string('status', 32);
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('published_as', 32)->default('author');
            $table->string('published_name')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['type', 'status']);
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
