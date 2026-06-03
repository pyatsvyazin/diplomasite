<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use App\Models\Request as ClientRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        Route::bind('request', function (string $value) {
            return ClientRequest::query()->findOrFail($value);
        });

        RateLimiter::for('api', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();
            $perMinute = $request->user() ? 300 : 120;

            return Limit::perMinute($perMinute)->by($key);
        });

        RateLimiter::for('auth-login', function (Request $request) {
            $email = strtolower((string) $request->input('email', ''));

            return Limit::perMinute(10)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('auth-sensitive', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('public-forms', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
