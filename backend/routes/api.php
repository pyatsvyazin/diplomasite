<?php

use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\Admin\LawyerController;
use App\Http\Controllers\Api\Admin\RequestController as AdminRequestController;
use App\Http\Controllers\Api\Admin\StaffController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-2fa', [AuthController::class, 'verify2fa']);
Route::post('/request', [RequestController::class, 'store']);
Route::post('/review', [ReviewController::class, 'store']);
Route::get('/reviews', [ReviewController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('roles');
        $data = $user->toArray();
        if (!empty($user->avatar_path)) {
            $data['avatar_path'] = url(\Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_path));
        }
        return $data;
    });
    Route::patch('/user', [AuthController::class, 'updateProfile']);
    Route::post('/user/request-password-change', [AuthController::class, 'requestPasswordChange']);
    Route::post('/user/confirm-password-change', [AuthController::class, 'confirmPasswordChange']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/requests/mine', [RequestController::class, 'myRequests']);
    Route::post('/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'store']);

    Route::middleware('admin.or.lawyer')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}', [AdminController::class, 'updateUser']);
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::patch('/requests/{id}', [AdminRequestController::class, 'update']);
        Route::get('/lawyers', [LawyerController::class, 'index']);
        Route::get('/staff', [StaffController::class, 'index']);
        Route::match(['patch', 'post'], '/staff/{id}', [StaffController::class, 'update']);
    });
});
