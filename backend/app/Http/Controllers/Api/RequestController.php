<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'   => 'required|string|max:255',
            'email'  => 'required|email',
            'phone'  => 'required|string|max:50',
            'message' => 'required|string|max:5000',
        ], [
            'name.required'   => 'Укажите имя.',
            'email.required' => 'Укажите email.',
            'email.email'    => 'Некорректный email.',
            'phone.required' => 'Укажите телефон.',
            'message.required' => 'Введите сообщение.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['client_id'] = $request->user()?->id;

        $clientRequest = RequestModel::create($data);

        return response()->json([
            'message' => 'Заявка отправлена.',
            'id'      => $clientRequest->id,
        ], 201);
    }
}