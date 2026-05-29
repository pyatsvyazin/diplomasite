<?php

namespace App\Observers;

use App\Models\Request as ClientRequest;
use App\Services\Conversation\ConversationBootstrapService;
use App\Services\Conversation\ConversationParticipantService;
use App\Services\Conversation\SystemMessageService;
use App\Services\Notification\NotificationService;
use App\Support\RequestStatusLabel;

class RequestObserver
{
    public function __construct(
        private ConversationBootstrapService $conversationBootstrap,
        private ConversationParticipantService $participantService,
        private SystemMessageService $systemMessages,
        private NotificationService $notifications,
    ) {
    }

    public function created(ClientRequest $request): void
    {
        $this->conversationBootstrap->bootstrapForRequest($request);
    }

    public function updated(ClientRequest $request): void
    {
        if ($request->wasChanged('client_id') && $request->client_id) {
            $this->participantService->ensureClientLinked($request);
        }

        if ($request->wasChanged('lawyer_id')) {
            $previous = $request->getOriginal('lawyer_id');
            $this->participantService->syncResponsibleLawyer($request, $previous ? (int) $previous : null);
        }

        if ($request->wasChanged('status')) {
            $conversation = $request->conversation;
            if ($conversation) {
                $label = RequestStatusLabel::ru($request->status);
                $this->systemMessages->create($conversation, 'Статус заявки изменён на «'.$label.'»');
            }
            try {
                $this->notifications->notifyRequestStatusChanged($request);
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }
}
