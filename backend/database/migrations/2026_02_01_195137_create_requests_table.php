<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();

            // Клиент (если авторизован)
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Юрист, назначенный на заявку
            $table->foreignId('lawyer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Данные для гостя
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();

            // Текст обращения
            $table->text('message');

            // Статус заявки
            $table->enum('status', [
                'new',
                'in_progress',
                'closed'
            ])->default('new');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};

?>