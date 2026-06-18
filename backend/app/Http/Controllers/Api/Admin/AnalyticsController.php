<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Meeting\MeetingStatus;
use App\Enums\Post\PostStatus;
use App\Enums\Post\PostType;
use App\Http\Controllers\Controller;
use App\Models\ActivityEvent;
use App\Models\Meeting;
use App\Models\Post;
use App\Models\Request as ClientRequest;
use App\Models\User;
use App\Services\Activity\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->roles()->where('name', 'admin')->exists()) {
            return response()->json(['message' => 'Доступ запрещён.'], 403);
        }

        $requestsTotal = ClientRequest::query()->count();

        $requestsByStatus = ClientRequest::query()
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $activeStatuses = [
            ClientRequest::STATUS_NEW,
            ClientRequest::STATUS_IN_PROGRESS,
        ];
        $requestsActive = ClientRequest::query()->whereIn('status', $activeStatuses)->count();
        $requestsReviewing = (int) ($requestsByStatus[ClientRequest::STATUS_REVIEWING] ?? 0);
        $requestsClosed = (int) ($requestsByStatus[ClientRequest::STATUS_CLOSED] ?? 0);
        $requestsRejected = (int) ($requestsByStatus[ClientRequest::STATUS_REJECTED] ?? 0);

        $meetingsTotal = Meeting::query()->count();
        $meetingsUpcoming = Meeting::query()
            ->where('status', MeetingStatus::Confirmed)
            ->where('start_at', '>=', now())
            ->count();
        $meetingsCompleted = Meeting::query()
            ->whereIn('status', [MeetingStatus::Completed, MeetingStatus::Cancelled])
            ->count();
        $meetingsOverdue = Meeting::query()
            ->where('status', MeetingStatus::Pending)
            ->where('start_at', '<', now())
            ->count();

        $meetingsByStatus = Meeting::query()
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $clientsCount = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'client'))->count();
        $lawyersCount = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))->count();
        $adminsCount = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'admin'))->count();

        $postsArticles = Post::query()
            ->where('type', PostType::Article)
            ->where('status', '!=', PostStatus::Archived)
            ->count();
        $postsPages = Post::query()
            ->where('type', PostType::Page)
            ->where('status', '!=', PostStatus::Archived)
            ->count();
        $postsNews = Post::query()
            ->where('type', PostType::News)
            ->where('status', '!=', PostStatus::Archived)
            ->count();
        $postsArchived = Post::query()->where('status', PostStatus::Archived)->count();

        $startMonth = now()->subMonths(11)->startOfMonth();
        $requestsByMonth = ClientRequest::query()
            ->where('created_at', '>=', $startMonth)
            ->get(['created_at'])
            ->groupBy(fn (ClientRequest $r) => $r->created_at->format('Y-m'))
            ->map(fn ($group) => $group->count())
            ->sortKeys();

        $monthLabels = [];
        $monthValues = [];
        for ($i = 0; $i < 12; $i += 1) {
            $key = $startMonth->copy()->addMonths($i)->format('Y-m');
            $monthLabels[] = $startMonth->copy()->addMonths($i)->locale('ru')->translatedFormat('M Y');
            $monthValues[] = (int) ($requestsByMonth[$key] ?? 0);
        }

        $topSubjects = ClientRequest::query()
            ->whereNotNull('subject')
            ->where('subject', '!=', '')
            ->select('subject', DB::raw('count(*) as count'))
            ->groupBy('subject')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['subject' => $row->subject, 'count' => (int) $row->count]);

        $statusPie = collect(ClientRequest::statuses())->map(fn (string $status) => [
            'status' => $status,
            'label' => \App\Support\RequestStatusLabel::ru($status),
            'count' => (int) ($requestsByStatus[$status] ?? 0),
        ])->values();

        $perPage = 10;
        $calendarPage = max(1, (int) $request->query('calendar_page', 1));
        $activityPage = max(1, (int) $request->query('activity_page', 1));

        $calendarPaginator = Meeting::query()
            ->with(['request:id,subject', 'responsibleLawyer:id,full_name'])
            ->whereBetween('start_at', [now()->startOfMonth(), now()->endOfMonth()->endOfDay()])
            ->orderBy('start_at')
            ->paginate($perPage, ['*'], 'calendar_page', $calendarPage);

        $calendarMeetings = collect($calendarPaginator->items())->map(fn (Meeting $m) => [
            'id' => $m->id,
            'title' => $m->title,
            'start_at' => $m->start_at?->toIso8601String(),
            'end_at' => $m->end_at?->toIso8601String(),
            'status' => $m->status?->value ?? $m->status,
            'request_id' => $m->request_id,
            'lawyer_name' => $m->responsibleLawyer?->full_name,
        ])->values();

        $activityLog = app(ActivityLogService::class);
        Cache::remember('activity_events:last_prune', 3600, function () use ($activityLog) {
            $activityLog->pruneExpired();

            return true;
        });

        $activityCutoff = $activityLog->retentionCutoff();
        $activityPaginator = ActivityEvent::query()
            ->where('created_at', '>=', $activityCutoff)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'activity_page', $activityPage);

        $recentActivity = collect($activityPaginator->items())->map(fn (ActivityEvent $e) => [
            'id' => $e->id,
            'event_type' => $e->event_type,
            'actor_name' => $e->actor_name,
            'summary' => $e->summary,
            'entity_type' => $e->entity_type,
            'entity_id' => $e->entity_id,
            'at' => $e->created_at?->toIso8601String(),
        ])->values();

        return response()->json([
            'data' => [
                'requests_total' => $requestsTotal,
                'requests_active' => $requestsActive,
                'requests_reviewing' => $requestsReviewing,
                'requests_closed' => $requestsClosed,
                'requests_rejected' => $requestsRejected,
                'meetings_total' => $meetingsTotal,
                'meetings_completed' => $meetingsCompleted,
                'meetings_upcoming' => $meetingsUpcoming,
                'meetings_overdue' => $meetingsOverdue,
                'clients_count' => $clientsCount,
                'lawyers_count' => $lawyersCount,
                'admins_count' => $adminsCount,
                'posts_articles' => $postsArticles,
                'posts_pages' => $postsPages,
                'posts_news' => $postsNews,
                'posts_archived' => $postsArchived,
                'summary' => [
                    'requests' => [
                        'total' => $requestsTotal,
                        'active' => $requestsActive,
                        'reviewing' => $requestsReviewing,
                        'closed' => $requestsClosed,
                    ],
                    'meetings' => [
                        'total' => $meetingsTotal,
                        'upcoming' => $meetingsUpcoming,
                        'completed' => $meetingsCompleted,
                        'overdue' => $meetingsOverdue,
                    ],
                    'users' => [
                        'clients' => $clientsCount,
                        'lawyers' => $lawyersCount,
                        'admins' => $adminsCount,
                    ],
                    'posts' => [
                        'articles' => $postsArticles,
                        'pages' => $postsPages,
                        'news' => $postsNews,
                        'archived' => $postsArchived,
                    ],
                ],
                'requests_by_month' => [
                    'labels' => $monthLabels,
                    'values' => $monthValues,
                ],
                'requests_status_pie' => $statusPie,
                'top_subjects' => $topSubjects,
                'meetings_by_status' => $meetingsByStatus,
                'recent_activity' => $recentActivity,
                'calendar_meetings' => $calendarMeetings,
                'calendar_meta' => [
                    'current_page' => $calendarPaginator->currentPage(),
                    'last_page' => $calendarPaginator->lastPage(),
                    'per_page' => $calendarPaginator->perPage(),
                    'total' => $calendarPaginator->total(),
                ],
                'activity_meta' => [
                    'current_page' => $activityPaginator->currentPage(),
                    'last_page' => $activityPaginator->lastPage(),
                    'per_page' => $activityPaginator->perPage(),
                    'total' => $activityPaginator->total(),
                ],
            ],
        ]);
    }
}
