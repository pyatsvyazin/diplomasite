<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Защита state-changing API от cross-site запросов без cookie-сессии.
 * CSRF-токен Laravel не используется: SPA авторизуется Bearer (Sanctum).
 */
class ValidateApiOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        if ($request->bearerToken()) {
            return $next($request);
        }

        if ($request->headers->get('X-Requested-With') !== 'XMLHttpRequest') {
            return response()->json([
                'message' => 'Запрос отклонён: требуется заголовок X-Requested-With.',
            ], 403);
        }

        $origin = $request->headers->get('Origin');
        if ($origin === null || $origin === '') {
            return $next($request);
        }

        $allowed = $this->allowedOrigins();
        if (in_array($origin, $allowed, true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Запрос отклонён: недопустимый источник (Origin).',
        ], 403);
    }

    /**
     * @return list<string>
     */
    private function allowedOrigins(): array
    {
        $fromEnv = array_filter(array_map(
            'trim',
            explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
        ));

        $extra = array_filter([
            config('app.frontend_url'),
            config('app.url'),
        ]);

        return array_values(array_unique(array_merge($fromEnv, $extra)));
    }
}
