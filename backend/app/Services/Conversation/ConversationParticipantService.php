<?php

namespace App\Services\Conversation;

use App\Enums\Chat\ConversationParticipantRole;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Request as ClientRequest;
use App\Models\User;

class ConversationParticipantService
{
    public function __construct(
        private SystemMessageService $systemMessages,
    ) {
    }

    /**
     * При привязке заявки к пользователю (client_id) — добавить в чат как клиента.
     */
    public function ensureClientLinked(ClientRequest $request): void
    {
        $conversation = $request->conversation;
        if (!$conversation || !$request->client_id) {
            return;
        }

        $row = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $request->client_id)
            ->first();

        if (!$row) {
            ConversationParticipant::query()->create([
                'conversation_id' => $conversation->id,
                'user_id' => $request->client_id,
                'role' => ConversationParticipantRole::Client,
            ]);
            $this->systemMessages->create($conversation, 'Клиент привязан к обращению');

            return;
        }

        if ($row->role !== ConversationParticipantRole::Client) {
            $row->role = ConversationParticipantRole::Client;
            $row->save();
            $this->systemMessages->create($conversation, 'Клиент привязан к обращению');
        }
    }

    /**
     * Назначение / смена ответственного юриста по заявке.
     */
    public function syncResponsibleLawyer(ClientRequest $request, ?int $previousLawyerId): void
    {
        $conversation = $request->conversation;
        if (!$conversation) {
            return;
        }

        $newId = $request->lawyer_id;

        if ($newId === $previousLawyerId) {
            return;
        }

        if ($previousLawyerId) {
            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $previousLawyerId)
                ->where('role', ConversationParticipantRole::ResponsibleLawyer)
                ->update(['role' => ConversationParticipantRole::Lawyer]);
        }

        if ($newId) {
            $p = ConversationParticipant::query()->firstOrNew([
                'conversation_id' => $conversation->id,
                'user_id' => $newId,
            ]);
            $p->role = ConversationParticipantRole::ResponsibleLawyer;
            $p->save();

            $name = User::query()->find($newId)?->full_name ?? 'Юрист';
            $this->systemMessages->create($conversation, "Ответственный юрист: {$name}");
        } elseif ($previousLawyerId) {
            $this->systemMessages->create($conversation, 'Ответственный юрист снят с обращения');
        }
    }

    public function addResponsibleLawyerSilent(Conversation $conversation, int $lawyerUserId): void
    {
        ConversationParticipant::query()->updateOrCreate(
            [
                'conversation_id' => $conversation->id,
                'user_id' => $lawyerUserId,
            ],
            ['role' => ConversationParticipantRole::ResponsibleLawyer],
        );
    }
}
