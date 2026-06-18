<?php

namespace App\Services\Meeting;

use App\Enums\Meeting\MeetingStatus;
use App\Enums\Meeting\MeetingType;
use App\Enums\NotificationType;
use App\Models\Meeting;
use App\Models\Request as ClientRequest;
use App\Models\User;
use App\Services\Activity\ActivityLogService;
use App\Services\Conversation\SystemMessageService;
use App\Services\Notification\NotificationService;
use App\Support\StaffBroadcast;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MeetingService
{
    public function __construct(
        private SystemMessageService $systemMessages,
        private NotificationService $notifications,
        private ActivityLogService $activityLog,
    ) {
    }

    public function createForRequest(ClientRequest $request, User $actor, array $data): Meeting
    {
        $this->assertCanCreateOnRequest($request);

        if (!$request->lawyer_id) {
            throw ValidationException::withMessages([
                'lawyer_id' => ['Сначала назначьте ответственного юриста по заявке.'],
            ]);
        }

        $conversation = $request->conversation;
        if (!$conversation) {
            throw ValidationException::withMessages([
                'request' => ['Чат по заявке не найден.'],
            ]);
        }

        $lawyerId = (int) $request->lawyer_id;
        if ($this->isAdmin($actor) && !empty($data['responsible_lawyer_id'])) {
            $lawyerId = (int) $data['responsible_lawyer_id'];
        }

        $payload = $this->validatedPayload($data);
        $this->assertNoOverlap($lawyerId, $payload['start_at'], $payload['end_at']);

        return DB::transaction(function () use ($request, $conversation, $actor, $lawyerId, $payload) {
            $meeting = Meeting::query()->create([
                'request_id' => $request->id,
                'conversation_id' => $conversation->id,
                'created_by' => $actor->id,
                'responsible_lawyer_id' => $lawyerId,
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'meeting_type' => $payload['meeting_type'],
                'status' => MeetingStatus::Pending,
                'start_at' => $payload['start_at'],
                'end_at' => $payload['end_at'],
                'location' => $payload['location'] ?? null,
                'meeting_link' => $payload['meeting_link'] ?? null,
                'confirmed_by_client' => false,
            ]);

            $meeting->load(['request', 'responsibleLawyer', 'creator']);

            $msg = 'Назначена консультация на '.$meeting->formatted_date;
            $this->systemMessages->create($conversation, $msg);
            $this->notifications->notifyMeetingEvent(
                $meeting,
                NotificationType::MeetingCreated,
                'Назначена консультация',
                $meeting->title.' — '.$meeting->formatted_date,
            );

            $this->activityLog->meetingCreated($actor, $meeting);

            StaffBroadcast::meeting($meeting->id, 'created');

            return $meeting;
        });
    }

    public function updateMeeting(Meeting $meeting, User $actor, array $data): Meeting
    {
        $this->assertCanManage($meeting, $actor);

        if (in_array($meeting->status, [MeetingStatus::Cancelled, MeetingStatus::Completed], true)) {
            throw ValidationException::withMessages([
                'status' => ['Нельзя редактировать завершённую или отменённую консультацию.'],
            ]);
        }

        $wasConfirmed = $meeting->status === MeetingStatus::Confirmed;

        $lawyerId = $meeting->responsible_lawyer_id;
        if ($this->isAdmin($actor) && !empty($data['responsible_lawyer_id'])) {
            $lawyerId = (int) $data['responsible_lawyer_id'];
        }

        $payload = $this->validatedPayload($data, $meeting->id, $lawyerId);
        $this->assertNoOverlap($lawyerId, $payload['start_at'], $payload['end_at'], $meeting->id);

        return DB::transaction(function () use ($meeting, $payload, $lawyerId, $wasConfirmed, $actor) {
            $meeting->fill([
                'responsible_lawyer_id' => $lawyerId,
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'meeting_type' => $payload['meeting_type'],
                'start_at' => $payload['start_at'],
                'end_at' => $payload['end_at'],
                'location' => $payload['location'] ?? null,
                'meeting_link' => $payload['meeting_link'] ?? null,
            ]);

            if ($wasConfirmed) {
                $meeting->status = MeetingStatus::Pending;
                $meeting->confirmed_by_client = false;
            }

            $meeting->save();
            $meeting->load(['request', 'conversation', 'responsibleLawyer']);

            $this->systemMessages->create(
                $meeting->conversation,
                'Консультация перенесена на '.$meeting->formatted_date
                    .($wasConfirmed ? '. Требуется повторное подтверждение клиента.' : ''),
            );

            $this->notifications->notifyMeetingEvent(
                $meeting,
                NotificationType::MeetingRescheduled,
                'Консультация перенесена',
                $meeting->title.' — '.$meeting->formatted_date,
            );

            $this->activityLog->meetingRescheduled($actor, $meeting);

            StaffBroadcast::meeting($meeting->id, 'updated');

            return $meeting;
        });
    }

    public function confirm(Meeting $meeting, User $client): Meeting
    {
        if ($meeting->request?->client_id !== $client->id) {
            throw ValidationException::withMessages(['meeting' => ['Подтвердить может только клиент по заявке.']]);
        }

        if ($meeting->status !== MeetingStatus::Pending) {
            throw ValidationException::withMessages(['status' => ['Консультация уже подтверждена или недоступна.']]);
        }

        return DB::transaction(function () use ($meeting) {
            $meeting->update([
                'status' => MeetingStatus::Confirmed,
                'confirmed_by_client' => true,
            ]);
            $meeting->load(['conversation', 'request']);

            $this->systemMessages->create($meeting->conversation, 'Клиент подтвердил консультацию');
            $this->notifications->notifyMeetingEvent(
                $meeting,
                NotificationType::MeetingConfirmed,
                'Консультация подтверждена',
                $meeting->title.' — '.$meeting->formatted_date,
            );

            StaffBroadcast::meeting($meeting->id, 'confirmed');

            return $meeting;
        });
    }

    public function cancel(Meeting $meeting, User $actor, ?string $reason = null): Meeting
    {
        $this->assertCanCancel($meeting, $actor);

        if (in_array($meeting->status, [MeetingStatus::Cancelled, MeetingStatus::Completed], true)) {
            throw ValidationException::withMessages(['status' => ['Консультация уже отменена или завершена.']]);
        }

        return DB::transaction(function () use ($meeting, $actor, $reason) {
            $meeting->update([
                'status' => MeetingStatus::Cancelled,
                'cancellation_reason' => $reason,
                'confirmed_by_client' => false,
            ]);
            $meeting->load(['conversation', 'request']);

            $this->systemMessages->create($meeting->conversation, 'Консультация отменена');
            $this->notifications->notifyMeetingEvent(
                $meeting,
                NotificationType::MeetingCancelled,
                'Консультация отменена',
                $reason ?: $meeting->title,
            );

            if ($this->activityLog->isStaff($actor)) {
                $this->activityLog->meetingCancelled($actor, $meeting);
            }

            StaffBroadcast::meeting($meeting->id, 'cancelled');

            return $meeting;
        });
    }

    public function complete(Meeting $meeting, User $actor): Meeting
    {
        $this->assertCanManage($meeting, $actor);

        if ($meeting->status === MeetingStatus::Cancelled) {
            throw ValidationException::withMessages(['status' => ['Нельзя завершить отменённую консультацию.']]);
        }

        return DB::transaction(function () use ($meeting, $actor) {
            $meeting->update(['status' => MeetingStatus::Completed]);
            $meeting->load(['conversation', 'request']);

            $this->systemMessages->create($meeting->conversation, 'Консультация завершена');
            $this->notifications->notifyMeetingEvent(
                $meeting,
                NotificationType::MeetingCompleted,
                'Консультация завершена',
                $meeting->title,
            );

            $this->activityLog->meetingCompleted($actor, $meeting);

            StaffBroadcast::meeting($meeting->id, 'completed');

            return $meeting;
        });
    }

    public function busySlotsForLawyer(int $lawyerId, Carbon $from, Carbon $to): array
    {
        return Meeting::query()
            ->where('responsible_lawyer_id', $lawyerId)
            ->whereIn('status', [MeetingStatus::Pending->value, MeetingStatus::Confirmed->value])
            ->where('start_at', '<', $to)
            ->where('end_at', '>', $from)
            ->orderBy('start_at')
            ->get(['id', 'start_at', 'end_at', 'status', 'title'])
            ->map(fn (Meeting $m) => [
                'id' => $m->id,
                'start_at' => $m->start_at?->toIso8601String(),
                'end_at' => $m->end_at?->toIso8601String(),
                'status' => $m->status?->value ?? $m->status,
                'title' => $m->title,
            ])
            ->values()
            ->all();
    }

    private function validatedPayload(array $data, ?int $exceptMeetingId = null, ?int $lawyerId = null): array
    {
        $type = MeetingType::tryFrom((string) ($data['meeting_type'] ?? ''));
        if (!$type) {
            throw ValidationException::withMessages(['meeting_type' => ['Укажите тип консультации.']]);
        }

        $start = Carbon::parse($data['start_at'])->utc();
        $end = Carbon::parse($data['end_at'])->utc();

        if ($end->lte($start)) {
            throw ValidationException::withMessages(['end_at' => ['Время окончания должно быть позже начала.']]);
        }

        $location = isset($data['location']) ? trim((string) $data['location']) : null;
        $link = isset($data['meeting_link']) ? trim((string) $data['meeting_link']) : null;

        if ($type === MeetingType::Offline && $location === '') {
            throw ValidationException::withMessages(['location' => ['Укажите адрес очной консультации.']]);
        }

        if ($type === MeetingType::Online && $link === '') {
            throw ValidationException::withMessages(['meeting_link' => ['Укажите ссылку на онлайн-встречу.']]);
        }

        return [
            'title' => trim((string) ($data['title'] ?? '')),
            'description' => isset($data['description']) ? trim((string) $data['description']) : null,
            'meeting_type' => $type->value,
            'start_at' => $start,
            'end_at' => $end,
            'location' => $type === MeetingType::Offline ? $location : null,
            'meeting_link' => $type === MeetingType::Online ? $link : null,
        ];
    }

    private function assertNoOverlap(int $lawyerId, Carbon $start, Carbon $end, ?int $exceptId = null): void
    {
        $q = Meeting::query()
            ->where('responsible_lawyer_id', $lawyerId)
            ->whereIn('status', [MeetingStatus::Pending->value, MeetingStatus::Confirmed->value])
            ->where('start_at', '<', $end)
            ->where('end_at', '>', $start);

        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        if ($q->exists()) {
            throw ValidationException::withMessages([
                'start_at' => ['У ответственного юриста уже есть консультация в это время.'],
            ]);
        }
    }

    private function assertCanCreateOnRequest(ClientRequest $request): void
    {
        if (in_array($request->status, [ClientRequest::STATUS_CLOSED, ClientRequest::STATUS_REJECTED], true)) {
            throw ValidationException::withMessages([
                'request' => ['Нельзя создавать консультации по закрытой или отклонённой заявке.'],
            ]);
        }
    }

    private function assertCanManage(Meeting $meeting, User $user): void
    {
        if ($this->isAdmin($user)) {
            return;
        }

        if ($this->isLawyer($user) && (int) $meeting->responsible_lawyer_id === (int) $user->id) {
            return;
        }

        throw ValidationException::withMessages(['meeting' => ['Недостаточно прав.']]);
    }

    private function assertCanCancel(Meeting $meeting, User $user): void
    {
        if ($this->isAdmin($user)) {
            return;
        }

        if ($meeting->request?->client_id === $user->id) {
            return;
        }

        if ($this->isLawyer($user) && (int) $meeting->responsible_lawyer_id === (int) $user->id) {
            return;
        }

        throw ValidationException::withMessages(['meeting' => ['Недостаточно прав для отмены.']]);
    }

    private function isAdmin(User $user): bool
    {
        return $user->roles()->where('name', 'admin')->exists();
    }

    private function isLawyer(User $user): bool
    {
        return $user->roles()->where('name', 'lawyer')->exists();
    }
}
