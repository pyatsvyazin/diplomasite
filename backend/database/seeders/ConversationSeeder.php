<?php

namespace Database\Seeders;

use App\Enums\Chat\ConversationParticipantRole;
use App\Enums\Chat\MessageType;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\Request as ClientRequest;
use App\Services\Conversation\ConversationBootstrapService;
use App\Services\Conversation\SystemMessageService;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
{
    public function run(): void
    {
        $bootstrap = app(ConversationBootstrapService::class);

        foreach (ClientRequest::query()->doesntHave('conversation')->cursor() as $request) {
            $bootstrap->bootstrapForRequest($request);
        }

        $this->seedDemoThreadMessages();
    }

    /**
     * В нескольких чатах, где пока только одно системное сообщение, добавить короткий диалог (для UI).
     */
    private function seedDemoThreadMessages(): void
    {
        $conversations = Conversation::query()
            ->with(['participantRecords', 'request'])
            ->withCount('messages')
            ->having('messages_count', '=', 1)
            ->whereDoesntHave('messages', function ($q) {
                $q->where('type', '!=', MessageType::System->value);
            })
            ->limit(5)
            ->get();

        foreach ($conversations as $conversation) {
            $clientRow = $conversation->participantRecords->first(
                fn (ConversationParticipant $p) => $p->role === ConversationParticipantRole::Client
            );
            $lawyerRow = $conversation->participantRecords->first(
                fn (ConversationParticipant $p) => in_array($p->role, [
                    ConversationParticipantRole::ResponsibleLawyer,
                    ConversationParticipantRole::Lawyer,
                ], true)
            );

            if ($clientRow) {
                Message::query()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $clientRow->user_id,
                    'type' => MessageType::Text,
                    'content' => 'Добрый день! Подскажите, пожалуйста, по срокам рассмотрения.',
                    'is_read' => false,
                ]);
            }

            if ($lawyerRow) {
                Message::query()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $lawyerRow->user_id,
                    'type' => MessageType::Text,
                    'content' => 'Здравствуйте! Уточним детали и ответим в ближайшее время.',
                    'is_read' => false,
                ]);
            }

            app(SystemMessageService::class)->create(
                $conversation,
                'Назначена встреча (демо-сообщение сидера).'
            );
        }
    }
}
