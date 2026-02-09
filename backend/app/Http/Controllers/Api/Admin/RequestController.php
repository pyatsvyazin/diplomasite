<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RequestModel::query()
            ->with(['client', 'lawyer', 'review', 'review.lawyer']);

        $status = $request->query('status');
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $items = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $items]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $req = RequestModel::find($id);
        if (!$req) {
            return response()->json(['message' => 'Заявка не найдена.'], 404);
        }

        $hasReview = $req->review()->exists();
        if ($hasReview) {
            $data = $request->only('client_id');
            $validator = Validator::make($data, [
                'client_id' => 'nullable|integer|exists:users,id',
            ], ['client_id.exists' => 'Пользователь не найден.']);
            if ($validator->fails()) {
                return response()->json(['message' => 'Ошибка валидации.', 'errors' => $validator->errors()], 422);
            }
            if (array_key_exists('client_id', $data)) {
                $req->client_id = $data['client_id'];
            }
            $req->save();
            $req->load(['client', 'lawyer', 'review']);
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

        if (array_key_exists('lawyer_id', $data)) {
            $req->lawyer_id = $data['lawyer_id'];
        }
        if (array_key_exists('client_id', $data)) {
            $req->client_id = $data['client_id'];
        }
        if (array_key_exists('status', $data)) {
            $req->status = $data['status'];
        }

        $req->save();

        $req->load(['client', 'lawyer']);

        return response()->json(['data' => $req]);
    }
}