<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * В проде security-заголовки отдаёт nginx (docker/nginx/snippets/security-*.conf).
 * Здесь только убираем служебный заголовок PHP, чтобы не дублировать CSP/HSTS/X-Frame.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->remove('X-Powered-By');

        return $response;
    }
}
