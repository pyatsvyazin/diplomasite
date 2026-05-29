<?php

namespace App\Providers;

use App\Models\Request as ClientRequest;
use App\Observers\RequestObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ClientRequest::observe(RequestObserver::class);
    }
}
