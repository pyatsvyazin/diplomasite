<?php

namespace App\Services\Notification;

use App\Enums\NotificationType;
use App\Models\Meeting;
use App\Models\Notification;
use App\Models\Request as ClientRequest;
use App\Models\User;
use App\Support\RequestStatusLabel;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function notify(
        User $user,
        NotificationType $type,
        string $title,
        ?string $body = null,
        ?string $link = null,
        ?array $meta = null,
    ): Notification {
        return Notification::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
            'meta' => $meta,
        ]);
    }

    public function notifyRequestStatusChanged(ClientRequest $request): void
    {
        $request->loadMissing(['client', 'lawyer']);
        $label = RequestStatusLabel::ru($request->status);
        $title = 'Статус заявки изменён';
        $body = 'Заявка №'.$request->id.': «'.$label.'»';
        $link = '/requests/'.$request->id.'/chat';

        $recipients = collect([$request->client, $request->lawyer])->filter();

        foreach ($recipients as $user) {
            $this->notify($user, NotificationType::RequestStatusChanged, $title, $body, $link, [
                'request_id' => $request->id,
            ]);
            $this->sendEmailIfConfigured($user, $title, $body);
        }
    }

    public function notifyMeetingEvent(Meeting $meeting, NotificationType $type, string $title, ?string $body = null): void
    {
        $meeting->loadMissing(['request.client', 'request.lawyer', 'responsibleLawyer']);
        $request = $meeting->request;
        if (!$request) {
            return;
        }

        $link = '/requests/'.$request->id.'/chat';
        $meta = ['meeting_id' => $meeting->id, 'request_id' => $request->id];

        $recipients = collect([
            $request->client,
            $request->lawyer,
            $meeting->responsibleLawyer,
        ])->filter()->unique('id');

        foreach ($recipients as $user) {
            $this->notify($user, $type, $title, $body, $link, $meta);
            $this->sendEmailIfConfigured($user, $title, $body ?? '');
        }
    }

    public function notifyMeetingReminder(Meeting $meeting, NotificationType $type, string $title, string $body): void
    {
        $meeting->loadMissing(['request.client', 'request.lawyer', 'responsibleLawyer']);
        $request = $meeting->request;
        if (!$request) {
            return;
        }

        $link = '/profile?tab=consultations';
        $meta = [
            'meeting_id' => $meeting->id,
            'request_id' => $request->id,
            'reminder_kind' => $type === NotificationType::MeetingReminder3Days ? '3d' : 'day',
        ];

        $recipients = collect([
            $request->client,
            $meeting->responsibleLawyer,
        ])->filter()->unique('id');

        foreach ($recipients as $user) {
            $exists = Notification::query()
                ->where('user_id', $user->id)
                ->where('type', $type->value)
                ->where('meta->meeting_id', $meeting->id)
                ->exists();

            if ($exists) {
                continue;
            }

            $this->notify($user, $type, $title, $body, $link, $meta);
            $this->sendEmailIfConfigured($user, $title, $body);
        }
    }

    /**
     * Опционально: MAIL_MAILER=smtp в .env — письма уйдут через Laravel Mail.
     */
    private function sendEmailIfConfigured(User $user, string $subject, string $body): void
    {
        if (config('mail.default') === 'log' || empty($user->email)) {
            return;
        }

        try {
            Mail::raw($body, function ($message) use ($user, $subject) {
                $message->to($user->email)->subject($subject);
            });
        } catch (\Throwable) {
            // не блокируем основной сценарий
        }
    }
}
