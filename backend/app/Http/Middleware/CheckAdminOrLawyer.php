<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminOrLawyer
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hasAccess = $user->roles()->whereIn('name', ['admin', 'lawyer'])->exists();
        if (!$hasAccess) {
            return response()->json(['message' => 'Доступ запрещён.'], 403);
        }

        return $next($request);
    }
}
