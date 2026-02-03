<?php

use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\LawyerController;
use App\Http\Controllers\Api\Admin\RequestController as AdminRequestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/request', [RequestController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('roles');
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/requests/mine', [RequestController::class, 'myRequests']);

    Route::middleware('admin.or.lawyer')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::patch('/requests/{id}', [AdminRequestController::class, 'update']);
        Route::get('/lawyers', [LawyerController::class, 'index']);
    });
});
