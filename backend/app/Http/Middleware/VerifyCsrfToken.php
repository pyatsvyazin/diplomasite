<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * CSRF только для маршрутов middleware-группы «web» (Blade).
     * JSON API (/api/*) — отдельная группа без CSRF, авторизация Bearer Sanctum.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];
}
