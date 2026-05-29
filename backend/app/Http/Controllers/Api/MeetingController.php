<?php

namespace App\Http\Controllers\Api;

use App\Enums\Meeting\MeetingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Meeting\CancelMeetingRequest;
use App\Http\Requests\Meeting\UpdateMeetingRequest;
use App\Models\Meeting;
use App\Models\Request as ClientRequest;
use App\Models\User;
use App\Services\Meeting\MeetingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function __construct(private MeetingService $meetings)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $q = Meeting::query()
            ->with(['request:id,subject,status,client_id,lawyer_id', 'responsibleLawyer:id,full_name', 'creator:id,full_name'])
            ->orderedByStart();

        $this->scopeForUser($q, $user);

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }

        if ($lawyerId = $request->query('lawyer_id')) {
            $q->where('responsible_lawyer_id', (int) $lawyerId);
        }

        if ($requestId = $request->query('request_id')) {
            $q->where('request_id', (int) $requestId);
        }

        if ($month = $request->query('month')) {
            if (preg_match('/^\d{4}-\d{2}$/', $month)) {
                [$y, $m] = array_map('intval', explode('-', $month));
                $q->forMonth($y, $m);
            }
        }

        if ($from = $request->query('from')) {
            $q->where('end_at', '>=', Carbon::parse($from)->utc());
        }

        if ($to = $request->query('to')) {
            $q->where('start_at', '<=', Carbon::parse($to)->utc());
        }

        $items = $q->get();

        return response()->json(['data' => $items->map(fn (Meeting $m) => $this->transform($m))]);
    }

    public function show(Request $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('view', $meeting);
        $meeting->load(['request', 'responsibleLawyer', 'creator']);

        return response()->json(['data' => $this->transform($meeting)]);
    }

    public function indexForRequest(Request $httpRequest, ClientRequest $request): JsonResponse
    {
        $user = $httpRequest->user();
        if (!$this->canAccessRequest($user, $request)) {
            return response()->json(['message' => 'Доступ запрещён.'], 403);
        }

        $items = $request->meetings()
            ->with(['responsibleLawyer:id,full_name', 'creator:id,full_name'])
            ->orderedByStart()
            ->get();

        return response()->json(['data' => $items->map(fn (Meeting $m) => $this->transform($m))]);
    }

    public function store(
        \App\Http\Requests\Meeting\StoreMeetingRequest $httpRequest,
        ClientRequest $request,
    ): JsonResponse {
        $this->authorize('create', [Meeting::class, $request]);

        $meeting = $this->meetings->createForRequest(
            $request,
            $httpRequest->user(),
            $httpRequest->validated(),
        );

        return response()->json(['data' => $this->transform($meeting)], 201);
    }

    public function update(UpdateMeetingRequest $httpRequest, Meeting $meeting): JsonResponse
    {
        $this->authorize('update', $meeting);

        $meeting = $this->meetings->updateMeeting($meeting, $httpRequest->user(), $httpRequest->validated());

        return response()->json(['data' => $this->transform($meeting)]);
    }

    public function confirm(Request $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('confirm', $meeting);

        $meeting = $this->meetings->confirm($meeting, $request->user());

        return response()->json(['data' => $this->transform($meeting)]);
    }

    public function cancel(CancelMeetingRequest $httpRequest, Meeting $meeting): JsonResponse
    {
        $this->authorize('cancel', $meeting);

        $meeting = $this->meetings->cancel(
            $meeting,
            $httpRequest->user(),
            $httpRequest->input('cancellation_reason'),
        );

        return response()->json(['data' => $this->transform($meeting)]);
    }

    public function complete(Request $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('complete', $meeting);

        $meeting = $this->meetings->complete($meeting, $request->user());

        return response()->json(['data' => $this->transform($meeting)]);
    }

    public function busySlots(Request $request, User $lawyer): JsonResponse
    {
        $from = Carbon::parse($request->query('from', now()->startOfMonth()))->utc();
        $to = Carbon::parse($request->query('to', now()->endOfMonth()))->utc();

        $slots = $this->meetings->busySlotsForLawyer((int) $lawyer->id, $from, $to);

        return response()->json(['data' => $slots]);
    }

    private function scopeForUser($query, User $user): void
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return;
        }

        if ($user->roles()->where('name', 'lawyer')->exists()) {
            $query->where('responsible_lawyer_id', $user->id);

            return;
        }

        $query->whereHas('request', fn ($r) => $r->where('client_id', $user->id));
    }

    private function canAccessRequest(User $user, ClientRequest $clientRequest): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($clientRequest->client_id === $user->id) {
            return true;
        }

        if ($user->roles()->where('name', 'lawyer')->exists()) {
            return (int) $clientRequest->lawyer_id === (int) $user->id
                || $clientRequest->conversation?->participantRecords()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    private function transform(Meeting $meeting): array
    {
        return [
            'id' => $meeting->id,
            'request_id' => $meeting->request_id,
            'conversation_id' => $meeting->conversation_id,
            'created_by' => $meeting->created_by,
            'responsible_lawyer_id' => $meeting->responsible_lawyer_id,
            'title' => $meeting->title,
            'description' => $meeting->description,
            'meeting_type' => $meeting->meeting_type?->value ?? $meeting->meeting_type,
            'status' => $meeting->status?->value ?? $meeting->status,
            'start_at' => $meeting->start_at?->toIso8601String(),
            'end_at' => $meeting->end_at?->toIso8601String(),
            'location' => $meeting->location,
            'meeting_link' => $meeting->meeting_link,
            'cancellation_reason' => $meeting->cancellation_reason,
            'confirmed_by_client' => $meeting->confirmed_by_client,
            'formatted_date' => $meeting->formatted_date,
            'formatted_status' => $meeting->formatted_status,
            'created_at' => $meeting->created_at?->toIso8601String(),
            'updated_at' => $meeting->updated_at?->toIso8601String(),
            'request' => $meeting->relationLoaded('request') ? $meeting->request : null,
            'responsible_lawyer' => $meeting->relationLoaded('responsibleLawyer') ? $meeting->responsibleLawyer : null,
            'creator' => $meeting->relationLoaded('creator') ? $meeting->creator : null,
        ];
    }
}
