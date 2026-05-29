<?php

namespace App\Services\Conversation;

use App\Enums\Chat\ConversationParticipantRole;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Request as ClientRequest;

class ConversationBootstrapService
{
    public function __construct(
        private SystemMessageService $systemMessages,
        private ConversationParticipantService $participants,
    ) {
    }

    /**
     * Одна заявка — один чат: создаётся conversation, клиент (если есть), первое системное сообщение.
     */
    public function bootstrapForRequest(ClientRequest $request): Conversation
    {
        $conversation = Conversation::query()->create([
            'request_id' => $request->id,
        ]);

        if ($request->client_id) {
            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $request->client_id,
                'role' => ConversationParticipantRole::Client,
            ]);
        }

        if ($request->lawyer_id) {
            $this->participants->addResponsibleLawyerSilent($conversation, $request->lawyer_id);
        }

        $this->systemMessages->create($conversation, 'Обращение создано');

        return $conversation->fresh();
    }
}
