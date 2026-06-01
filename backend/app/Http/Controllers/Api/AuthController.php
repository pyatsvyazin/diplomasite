<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationLink;
use App\Mail\PasswordChangeCode;
use App\Mail\PasswordResetLink;
use App\Mail\TwoFactorCode;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Нормализация телефона до 11 цифр (7XXXXXXXXXX). Возвращает null если невалидно.
     */
    private static function normalizePhone(string $value): ?string
    {
        $digits = preg_replace('/\D/', '', $value);
        if (strlen($digits) === 10) {
            $digits = '7' . $digits;
        } elseif (strlen($digits) === 11 && $digits[0] === '8') {
            $digits = '7' . substr($digits, 1);
        }
        return (strlen($digits) === 11 && $digits[0] === '7') ? $digits : null;
    }

    /**
     * Регистрация нового пользователя (роль client по умолчанию).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => [
                'required',
                'string',
                'max:50',
                function (string $attr, $value, $fail) {
                    if (self::normalizePhone($value) === null) {
                        $fail('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[0-9])(?=.*[^\p{L}\p{N}\s]).{8,}$/u',
            ],
        ], [
            'full_name.required' => 'ФИО обязательно для заполнения.',
            'email.required' => 'Email обязателен для заполнения.',
            'email.email' => 'Укажите корректный email.',
            'email.unique' => 'Пользователь с таким email уже зарегистрирован.',
            'password.required' => 'Пароль обязателен для заполнения.',
            'password.min' => 'Пароль должен быть не менее 8 символов.',
            'password.confirmed' => 'Подтверждение пароля не совпадает.',
            'password.regex' => 'Пароль должен содержать минимум одну цифру и один спецсимвол (!@#$%^&* и т.д.).',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => self::normalizePhone($validated['phone']),
            'password' => Hash::make($validated['password']),
            'two_factor_enabled' => false,
        ]);

        $clientRole = Role::where('name', 'client')->first();
        if ($clientRole) {
            $user->roles()->attach($clientRole->id);
        }

        $verifyToken = Str::random(64);
        Cache::put('verify_email:' . $verifyToken, ['user_id' => $user->id], now()->addMinutes(60));
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $verifyUrl = $frontendUrl . '/auth/verify-email?token=' . urlencode($verifyToken) . '&email=' . urlencode($user->email);
        Mail::to($user->email)->send(new EmailVerificationLink($verifyUrl, $user->full_name ?? ''));

        return response()->json([
            'message' => 'На вашу почту отправлена ссылка для подтверждения. Перейдите по ней, затем войдите в аккаунт.',
            'require_verification' => true,
        ], 201);
    }

    /**
     * Подтверждение почты по токену из письма.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ], [
            'token.required' => 'Токен отсутствует.',
            'email.required' => 'Укажите email.',
            'email.email' => 'Укажите корректный email.',
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'Пользователь с таким email не найден.'], 400);
        }

        $key = 'verify_email:' . $validated['token'];
        $data = Cache::get($key);
        if (!$data || ($data['user_id'] ?? null) != $user->id) {
            return response()->json(['message' => 'Неверная или устаревшая ссылка. Запросите новую при регистрации или повторной отправке.'], 400);
        }

        Cache::forget($key);
        $user->email_verified_at = now();
        $user->save();

        return response()->json([
            'message' => 'Почта успешно подтверждена. Теперь вы можете войти в аккаунт.',
        ]);
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

        if ($user->is_blocked) {
            Auth::logout();
            return response()->json([
                'message' => 'Аккаунт заблокирован.',
            ], 403);
        }

        if (!$user->hasVerifiedEmail()) {
            Auth::logout();
            return response()->json([
                'message' => 'Подтвердите адрес почты. Перейдите по ссылке из письма, отправленного при регистрации.',
            ], 403);
        }

        Auth::logout();

        if (!$user->two_factor_enabled) {
            $user->tokens()->delete();
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json([
                'message' => 'Вы успешно вошли!',
                'user' => $user->load('roles'),
                'token' => $token,
                'token_type' => 'Bearer',
            ]);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $pendingId = Str::random(64);
        Cache::put('2fa:' . $pendingId, [
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
        ], now()->addMinutes(10));

        Mail::to($user->email)->send(new TwoFactorCode($code));

        return response()->json([
            'message' => 'Введите код из письма',
            'requires_2fa' => true,
            'pending_2fa_id' => $pendingId,
        ]);
    }

    /**
     * Проверка кода 2FA и выдача токена.
     */
    public function verify2fa(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pending_2fa_id' => 'required|string',
            'code' => 'required|string|size:6',
        ], [
            'pending_2fa_id.required' => 'Сессия входа не найдена. Выполните вход снова.',
            'code.required' => 'Введите код из письма.',
            'code.size' => 'Код состоит из 6 цифр.',
        ]);

        $key = '2fa:' . $validated['pending_2fa_id'];
        $data = Cache::get($key);
        if (!$data || !Hash::check($validated['code'], $data['code_hash'])) {
            return response()->json([
                'message' => 'Неверный или устаревший код. Выполните вход снова.',
            ], 400);
        }

        Cache::forget($key);
        $user = User::findOrFail($data['user_id']);
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
        /**
     * Обновление профиля текущего пользователя. При смене email или телефона обязателен текущий пароль.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $request->user()->id,
            'phone' => [
                'required',
                'string',
                'max:50',
                function (string $attr, $value, $fail) {
                    if (self::normalizePhone($value) === null) {
                        $fail('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
                    }
                },
            ],
            'current_password' => 'sometimes|string',
        ], [
            'full_name.max' => 'ФИО не должно превышать 255 символов.',
            'email.email' => 'Укажите корректный email.',
            'email.unique' => 'Пользователь с таким email уже зарегистрирован.',
            'phone.required' => 'Телефон обязателен для заполнения.',
        ]);

        $user = $request->user();
        $emailChanged = array_key_exists('email', $validated) && $validated['email'] !== $user->email;
        $phoneChanged = array_key_exists('phone', $validated) && self::normalizePhone($validated['phone']) !== $user->phone;

        if ($emailChanged || $phoneChanged) {
            $currentPassword = $validated['current_password'] ?? '';
            if (!$currentPassword || !Hash::check($currentPassword, $user->password)) {
                return response()->json([
                    'message' => 'Для смены email или телефона введите текущий пароль.',
                ], 422);
            }
        }

        if (array_key_exists('full_name', $validated)) {
            $user->full_name = $validated['full_name'];
        }
        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }
        if (array_key_exists('phone', $validated)) {
            $user->phone = self::normalizePhone($validated['phone']);
        }
        $user->save();

        $user->load('roles');
        $data = $user->toArray();
        if (!empty($user->avatar_path)) {
            $data['avatar_path'] = url(\Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_path));
        }
        return response()->json($data);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ], [
            'avatar.required' => 'Выберите изображение.',
            'avatar.image' => 'Файл должен быть изображением.',
            'avatar.max' => 'Размер файла не более 2 МБ.',
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }
        $user->avatar_path = $path;
        $user->save();
        $user->load('roles');

        $data = $user->toArray();
        if (!empty($user->avatar_path)) {
            $data['avatar_path'] = url(Storage::disk('public')->url($user->avatar_path));
        }

        return response()->json($data);
    }

    /**
     * Включение/выключение двухфакторной аутентификации при входе. Требуется текущий пароль.
     */
    public function update2fa(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'two_factor_enabled' => 'required|boolean',
            'current_password' => 'required|string',
        ], [
            'two_factor_enabled.required' => 'Укажите значение настройки.',
            'current_password.required' => 'Введите текущий пароль для подтверждения.',
        ]);

        $user = $request->user();
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Неверный пароль.',
            ], 422);
        }

        $user->two_factor_enabled = $validated['two_factor_enabled'];
        $user->save();

        $user->load('roles');
        $data = $user->toArray();
        if (!empty($user->avatar_path)) {
            $data['avatar_path'] = url(\Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_path));
        }
        return response()->json([
            'message' => $validated['two_factor_enabled'] ? 'Двухфакторная аутентификация включена.' : 'Двухфакторная аутентификация выключена.',
            'user' => $data,
        ]);
    }

    /**
     * Запрос на смену пароля: отправка кода на email.
     */
    public function requestPasswordChange(Request $request): JsonResponse
    {
        $user = $request->user();
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $key = 'pw_change:' . $user->id;
        Cache::put($key, ['code_hash' => Hash::make($code)], now()->addMinutes(10));
        Mail::to($user->email)->send(new PasswordChangeCode($code));
        return response()->json(['message' => 'Код отправлен на вашу почту.']);
    }

    /**
     * Подтверждение смены пароля по коду из письма.
     */
    public function confirmPasswordChange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|size:6',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[0-9])(?=.*[^\p{L}\p{N}\s]).{8,}$/u',
            ],
        ], [
            'code.required' => 'Введите код из письма.',
            'code.size' => 'Код состоит из 6 цифр.',
            'password.required' => 'Пароль обязателен.',
            'password.min' => 'Пароль должен быть не менее 8 символов.',
            'password.confirmed' => 'Подтверждение пароля не совпадает.',
            'password.regex' => 'Пароль должен содержать минимум одну цифру и один спецсимвол.',
        ]);

        $user = $request->user();
        $key = 'pw_change:' . $user->id;
        $data = Cache::get($key);
        if (!$data || !Hash::check($validated['code'], $data['code_hash'])) {
            return response()->json(['message' => 'Неверный или устаревший код. Запросите новый.'], 400);
        }
        Cache::forget($key);
        $user->password = Hash::make($validated['password']);
        $user->save();
        return response()->json(['message' => 'Пароль успешно изменён.']);
    }

    /**
     * Запрос на восстановление пароля: отправка ссылки на email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Укажите email.',
            'email.email' => 'Укажите корректный email.',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Пользователь с таким email не зарегистрирован.',
            ], 422);
        }

        if ($user->is_blocked) {
            return response()->json([
                'message' => 'Аккаунт заблокирован.',
            ], 403);
        }

        $plainToken = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($plainToken),
                'created_at' => now(),
            ]
        );

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $resetUrl = $frontendUrl . '/auth/reset-password?token=' . urlencode($plainToken) . '&email=' . urlencode($user->email);

        try {
            Mail::to($user->email)->send(new PasswordResetLink($resetUrl, $user->full_name ?? ''));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Forgot password: failed to send email', [
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Не удалось отправить письмо. Попробуйте позже.',
            ], 500);
        }

        return response()->json([
            'message' => 'На вашу почту отправлена ссылка для сброса пароля.',
        ]);
    }

    /**
     * Установка нового пароля по токену из письма.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[0-9])(?=.*[^\p{L}\p{N}\s]).{8,}$/u',
            ],
        ], [
            'token.required' => 'Токен сброса отсутствует.',
            'email.required' => 'Укажите email.',
            'email.email' => 'Укажите корректный email.',
            'password.required' => 'Пароль обязателен.',
            'password.min' => 'Пароль должен быть не менее 8 символов.',
            'password.confirmed' => 'Подтверждение пароля не совпадает.',
            'password.regex' => 'Пароль должен содержать минимум одну цифру и один спецсимвол.',
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();
        if (!$row || !Hash::check($validated['token'], $row->token)) {
            return response()->json([
                'message' => 'Неверная или устаревшая ссылка для сброса пароля. Запросите новую.',
            ], 400);
        }

        $expireMinutes = config('auth.passwords.users.expire', 60);
        $createdAt = \Carbon\Carbon::parse($row->created_at);
        if ($createdAt->addMinutes($expireMinutes)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json([
                'message' => 'Ссылка для сброса пароля истекла. Запросите новую.',
            ], 400);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();
        $user->password = Hash::make($validated['password']);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Пароль успешно изменён. Войдите с новым паролем.',
        ]);
    }
}
