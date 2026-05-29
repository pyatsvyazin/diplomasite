<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Request as ClientRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            ClientRequest::STATUS_REVIEWING,
            ClientRequest::STATUS_IN_PROGRESS,
        ];
        $requestsActive = ClientRequest::query()->whereIn('status', $activeStatuses)->count();
        $requestsClosed = (int) ($requestsByStatus[ClientRequest::STATUS_CLOSED] ?? 0);
        $requestsRejected = (int) ($requestsByStatus[ClientRequest::STATUS_REJECTED] ?? 0);

        $meetingsTotal = Meeting::query()->count();
        $meetingsCompleted = Meeting::query()->where('status', 'completed')->count();
        $meetingsUpcoming = Meeting::query()
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_at', '>=', now())
            ->count();

        $meetingsByStatus = Meeting::query()
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $clientsCount = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'client'))->count();
        $lawyersCount = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))->count();

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

        $recentRequests = ClientRequest::query()
            ->with(['client:id,full_name', 'lawyer:id,full_name'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (ClientRequest $r) => [
                'type' => 'request',
                'id' => $r->id,
                'title' => 'Заявка №'.$r->id,
                'subtitle' => $r->subject ?: 'Без темы',
                'status' => $r->status,
                'at' => $r->created_at?->toIso8601String(),
            ]);

        $recentMeetings = Meeting::query()
            ->with(['request:id,subject'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Meeting $m) => [
                'type' => 'meeting',
                'id' => $m->id,
                'title' => $m->title,
                'subtitle' => $m->request?->subject,
                'status' => $m->status?->value ?? $m->status,
                'at' => $m->created_at?->toIso8601String(),
            ]);

        $recentActivity = $recentRequests
            ->concat($recentMeetings)
            ->sortByDesc('at')
            ->take(12)
            ->values();

        $calendarMeetings = Meeting::query()
            ->with(['request:id,subject', 'responsibleLawyer:id,full_name'])
            ->whereBetween('start_at', [now()->startOfMonth(), now()->endOfMonth()->endOfDay()])
            ->orderBy('start_at')
            ->get()
            ->map(fn (Meeting $m) => [
                'id' => $m->id,
                'title' => $m->title,
                'start_at' => $m->start_at?->toIso8601String(),
                'end_at' => $m->end_at?->toIso8601String(),
                'status' => $m->status?->value ?? $m->status,
                'request_id' => $m->request_id,
                'lawyer_name' => $m->responsibleLawyer?->full_name,
            ]);

        return response()->json([
            'data' => [
                'requests_total' => $requestsTotal,
                'requests_active' => $requestsActive,
                'requests_closed' => $requestsClosed,
                'requests_rejected' => $requestsRejected,
                'meetings_total' => $meetingsTotal,
                'meetings_completed' => $meetingsCompleted,
                'meetings_upcoming' => $meetingsUpcoming,
                'clients_count' => $clientsCount,
                'lawyers_count' => $lawyersCount,
                'requests_by_month' => [
                    'labels' => $monthLabels,
                    'values' => $monthValues,
                ],
                'requests_status_pie' => $statusPie,
                'top_subjects' => $topSubjects,
                'meetings_by_status' => $meetingsByStatus,
                'recent_activity' => $recentActivity,
                'calendar_meetings' => $calendarMeetings,
            ],
        ]);
    }
}
