<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class RequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user && $request->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($token) {
                $user = $token->tokenable;
            }
        }

        if ($user) {
            $validator = Validator::make($request->all(), [
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ], [
                'subject.required' => 'Укажите тему.',
                'message.required' => 'Введите сообщение.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Ошибка валидации.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data = [
                'client_id' => $user->id,
                'name'      => $user->full_name,
                'email'     => $user->email,
                'phone'     => $user->phone ?? '',
                'subject'   => $request->input('subject'),
                'message'   => $request->input('message'),
            ];
        } else {
            $validator = Validator::make($request->all(), [
                'name'    => 'required|string|max:255',
                'email'   => 'required|email',
                'phone'   => 'required|string|max:50',
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ], [
                'name.required'   => 'Укажите имя.',
                'email.required' => 'Укажите email.',
                'email.email'    => 'Некорректный email.',
                'phone.required' => 'Укажите телефон.',
                'message.required' => 'Введите сообщение.',
                'subject.required' => 'Укажите тему.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Ошибка валидации.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            $data['client_id'] = null;
        }

        $clientRequest = RequestModel::create($data);

        return response()->json([
            'message' => 'Заявка отправлена.',
            'id'      => $clientRequest->id,
        ], 201);
    }

        /**
     * Заявки текущего пользователя (как клиент или как юрист).
     */
    public function myRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['data' => []], 200);
        }

        $items = RequestModel::query()
            ->where('client_id', $user->id)
            ->orWhere('lawyer_id', $user->id)
            ->with(['client', 'lawyer', 'review', 'review.lawyer'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $items]);
    }
}