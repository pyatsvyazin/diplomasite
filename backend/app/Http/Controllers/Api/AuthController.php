<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Регистрация нового пользователя (роль client по умолчанию).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'full_name.required' => 'ФИО обязательно для заполнения.',
            'email.required' => 'Email обязателен для заполнения.',
            'email.email' => 'Укажите корректный email.',
            'email.unique' => 'Пользователь с таким email уже зарегистрирован.',
            'password.required' => 'Пароль обязателен для заполнения.',
            'password.min' => 'Пароль должен быть не менее 8 символов.',
            'password.confirmed' => 'Подтверждение пароля не совпадает.',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        $clientRole = Role::where('name', 'client')->first();
        if ($clientRole) {
            $user->roles()->attach($clientRole->id);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Вы успешно зарегистрированы!',
            'user' => $user->load('roles'),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Вход в систему.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Email обязателен для заполнения.',
            'email.email' => 'Email должен быть валидным.',
            'password.required' => 'Пароль обязателен для заполнения.',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Неверный email или пароль.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Вы успешно вошли!',
            'user' => $user->load('roles'),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Выход (инвалидация токена).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Вы успешно вышли из системы.']);
    }
}
