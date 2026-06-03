<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Дублирует security-заголовки для ответов Laravel (если nginx не добавил).
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff', true);
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', true);
        $response->headers->set('X-Frame-Options', 'DENY', true);
        $response->headers->remove('X-Powered-By');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()', true);

        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains',
                true
            );
        }

        return $response;
    }
}
