<?php

namespace App\Services\Activity;

use App\Enums\Post\PostStatus;
use App\Enums\Post\PostType;
use App\Models\ActivityEvent;
use App\Models\Meeting;
use App\Models\Post;
use App\Models\Request as ClientRequest;
use App\Models\User;
use App\Support\RequestStatusLabel;
use Illuminate\Support\Carbon;

class ActivityLogService
{
    public function isStaff(User $user): bool
    {
        return $user->roles()->whereIn('name', ['admin', 'lawyer'])->exists();
    }

    public function log(User $actor, string $eventType, string $summary, ?string $entityType = null, ?int $entityId = null, ?array $meta = null): void
    {
        if (!$this->isStaff($actor)) {
            return;
        }

        ActivityEvent::query()->create([
            'event_type' => $eventType,
            'actor_id' => $actor->id,
            'actor_name' => $actor->full_name ?: 'Сотрудник',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'summary' => $summary,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }

    public function userRegisteredByAdmin(User $actor, User $created, string $roleName): void
    {
        $roleRu = match ($roleName) {
            'lawyer' => 'юрист',
            'admin' => 'администратор',
            default => 'клиент',
        };

        $this->log(
            $actor,
            'user_registered',
            sprintf('Зарегистрирован пользователь %s (%s)', $created->full_name, $roleRu),
            'user',
            $created->id,
            ['role' => $roleName, 'email' => $created->email],
        );
    }

    public function postCreated(User $actor, Post $post): void
    {
        $this->log(
            $actor,
            'post_created',
            sprintf('Создан %s «%s»', $this->postTypeRu($post), $post->title),
            'post',
            $post->id,
            ['post_type' => $post->type?->value, 'status' => $post->status?->value],
        );
    }

    public function postUpdated(User $actor, Post $post, ?string $oldStatus = null): void
    {
        $newStatus = $post->status?->value ?? (string) $post->status;

        if ($oldStatus !== null && $oldStatus !== $newStatus) {
            $this->log(
                $actor,
                'post_status_changed',
                sprintf(
                    'Пост «%s»: статус «%s» → «%s»',
                    $post->title,
                    $this->postStatusRu($oldStatus),
                    $this->postStatusRu($newStatus),
                ),
                'post',
                $post->id,
                ['old_status' => $oldStatus, 'new_status' => $newStatus],
            );

            return;
        }

        $this->log(
            $actor,
            'post_updated',
            sprintf('Изменён %s «%s»', $this->postTypeRu($post), $post->title),
            'post',
            $post->id,
        );
    }

    public function postDeleted(User $actor, Post $post): void
    {
        $this->log(
            $actor,
            'post_deleted',
            sprintf('Удалён %s «%s»', $this->postTypeRu($post), $post->title),
            'post',
            $post->id,
        );
    }

    public function requestStatusChanged(User $actor, ClientRequest $request, string $oldStatus, string $newStatus): void
    {
        $this->log(
            $actor,
            'request_status_changed',
            sprintf(
                'Заявка №%d: «%s» → «%s»',
                $request->id,
                RequestStatusLabel::ru($oldStatus),
                RequestStatusLabel::ru($newStatus),
            ),
            'request',
            $request->id,
            ['old_status' => $oldStatus, 'new_status' => $newStatus, 'subject' => $request->subject],
        );
    }

    public function requestLawyerChanged(User $actor, ClientRequest $request, ?int $oldLawyerId, ?int $newLawyerId): void
    {
        if ($oldLawyerId === $newLawyerId) {
            return;
        }

        if ($newLawyerId) {
            $lawyer = User::query()->find($newLawyerId);
            $name = $lawyer?->full_name ?: 'юрист';
            $summary = sprintf('Заявка №%d: назначен юрист %s', $request->id, $name);
            $type = 'request_lawyer_assigned';
        } else {
            $summary = sprintf('Заявка №%d: юрист снят', $request->id);
            $type = 'request_lawyer_unassigned';
        }

        $this->log($actor, $type, $summary, 'request', $request->id);
    }

    public function meetingCreated(User $actor, Meeting $meeting): void
    {
        $this->log(
            $actor,
            'meeting_created',
            sprintf('Назначена консультация «%s» по заявке №%d', $meeting->title, $meeting->request_id),
            'meeting',
            $meeting->id,
            ['start_at' => $meeting->start_at?->toIso8601String()],
        );
    }

    public function meetingRescheduled(User $actor, Meeting $meeting): void
    {
        $this->log(
            $actor,
            'meeting_rescheduled',
            sprintf('Консультация «%s» перенесена на %s', $meeting->title, $meeting->formatted_date),
            'meeting',
            $meeting->id,
        );
    }

    public function meetingCancelled(User $actor, Meeting $meeting): void
    {
        $this->log(
            $actor,
            'meeting_cancelled',
            sprintf('Консультация «%s» отменена', $meeting->title),
            'meeting',
            $meeting->id,
        );
    }

    public function meetingCompleted(User $actor, Meeting $meeting): void
    {
        $this->log(
            $actor,
            'meeting_completed',
            sprintf('Консультация «%s» завершена', $meeting->title),
            'meeting',
            $meeting->id,
        );
    }

    private function postTypeRu(Post $post): string
    {
        $type = $post->type instanceof PostType ? $post->type : PostType::tryFrom((string) $post->type);

        return match ($type) {
            PostType::Article => 'материал (статья)',
            PostType::News => 'новость',
            PostType::Page => 'страница',
            default => 'пост',
        };
    }

    private function postStatusRu(string $status): string
    {
        $enum = PostStatus::tryFrom($status);

        return match ($enum) {
            PostStatus::Draft => 'черновик',
            PostStatus::Published => 'опубликовано',
            PostStatus::Archived => 'в архиве',
            default => $status,
        };
    }
}
