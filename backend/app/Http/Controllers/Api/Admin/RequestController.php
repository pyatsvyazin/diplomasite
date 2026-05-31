<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\User;
use App\Services\Activity\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequestController extends Controller
{
    public function __construct(private ActivityLogService $activityLog)
    {
    }
    public function index(Request $request): JsonResponse
    {
        $query = RequestModel::query()
            ->with(['client', 'lawyer', 'review', 'review.lawyer']);

        $status = $request->query('status');
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $perPage = (int) $request->query('per_page', 20);
        $page = (int) $request->query('page', 1);

        $paginator = $query->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $req = RequestModel::find($id);
        if (!$req) {
            return response()->json(['message' => 'Заявка не найдена.'], 404);
        }

        $actor = $request->user();
        $oldStatus = $req->status;
        $oldLawyerId = $req->lawyer_id;

        $hasReview = $req->review()->exists();
        if ($hasReview) {
            $data = $request->only(['client_id', 'lawyer_id']);
            $validator = Validator::make($data, [
                'client_id' => 'nullable|integer|exists:users,id',
                'lawyer_id' => 'nullable|integer|exists:users,id',
            ], [
                'client_id.exists' => 'Пользователь не найден.',
                'lawyer_id.exists' => 'Пользователь не найден.',
            ]);
            if ($validator->fails()) {
                return response()->json(['message' => 'Ошибка валидации.', 'errors' => $validator->errors()], 422);
            }
            if ($request->exists('client_id')) {
                $req->client_id = $request->input('client_id');
            }
            if ($request->exists('lawyer_id')) {
                $req->lawyer_id = $request->input('lawyer_id');
            }
            $req->save();
            $req->load(['client', 'lawyer', 'review']);
            $this->logRequestChanges($actor, $req, $oldStatus, $oldLawyerId);

            return response()->json(['data' => $req]);
        }

        $validator = Validator::make($request->all(), [
            'status'     => 'sometimes|string|in:' . implode(',', RequestModel::statuses()),
            'lawyer_id'  => 'nullable|integer|exists:users,id',
            'client_id'  => 'nullable|integer|exists:users,id',
        ], [
            'status.in'    => 'Недопустимый статус.',
            'lawyer_id.exists' => 'Пользователь не найден.',
            'client_id.exists' => 'Пользователь не найден.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        if ($request->exists('lawyer_id')) {
            $req->lawyer_id = $request->input('lawyer_id');
        }
        if ($request->exists('client_id')) {
            $req->client_id = $request->input('client_id');
        }
        if (array_key_exists('status', $data)) {
            $req->status = $data['status'];
        }

        $req->save();

        $req->load(['client', 'lawyer']);
        $this->logRequestChanges($actor, $req, $oldStatus, $oldLawyerId);

        return response()->json(['data' => $req]);
    }

    private function logRequestChanges(?User $actor, RequestModel $req, string $oldStatus, ?int $oldLawyerId): void
    {
        if (!$actor || !$this->activityLog->isStaff($actor)) {
            return;
        }

        if ($req->status !== $oldStatus) {
            $this->activityLog->requestStatusChanged($actor, $req, $oldStatus, $req->status);
        }

        if ((int) $req->lawyer_id !== (int) $oldLawyerId) {
            $this->activityLog->requestLawyerChanged($actor, $req, $oldLawyerId ? (int) $oldLawyerId : null, $req->lawyer_id ? (int) $req->lawyer_id : null);
        }
    }
}