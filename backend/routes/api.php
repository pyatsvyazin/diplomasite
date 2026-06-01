<?php

use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\Admin\LawyerController;
use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\RequestController as AdminRequestController;
use App\Http\Controllers\Api\Admin\SpecialtyController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\PostController as AdminPostController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\ConversationAttachmentController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\ConversationMessageController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\PublicStaffController;
use App\Http\Controllers\Api\ServiceController;
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
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-2fa', [AuthController::class, 'verify2fa']);
Route::post('/request', [RequestController::class, 'store']);
Route::post('/review', [ReviewController::class, 'store']);
Route::get('/reviews/lawyers', [ReviewController::class, 'lawyersWithPublishedReviews']);
Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);
Route::get('/staff', [PublicStaffController::class, 'index']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);

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
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    Route::patch('/user/2fa', [AuthController::class, 'update2fa']);
    Route::post('/user/request-password-change', [AuthController::class, 'requestPasswordChange']);
    Route::post('/user/confirm-password-change', [AuthController::class, 'confirmPasswordChange']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/requests/mine', [RequestController::class, 'myRequests']);
    Route::get('/requests/{request}/conversation', [ConversationController::class, 'showForRequest']);
    Route::get('/requests/{request}/meetings', [MeetingController::class, 'indexForRequest']);
    Route::post('/requests/{request}/meetings', [MeetingController::class, 'store']);

    Route::get('/meetings', [MeetingController::class, 'index']);
    Route::get('/meetings/{meeting}', [MeetingController::class, 'show']);
    Route::put('/meetings/{meeting}', [MeetingController::class, 'update']);
    Route::post('/meetings/{meeting}/confirm', [MeetingController::class, 'confirm']);
    Route::post('/meetings/{meeting}/cancel', [MeetingController::class, 'cancel']);
    Route::post('/meetings/{meeting}/complete', [MeetingController::class, 'complete']);

    Route::get('/lawyers/{user}/busy-slots', [MeetingController::class, 'busySlots']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'store']);

    Route::get('/chats', [ConversationController::class, 'index']);
    Route::get('/chats/{conversation}', [ConversationController::class, 'show']);
    Route::post('/chats/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::get('/chats/{conversation}/messages', [ConversationMessageController::class, 'index']);
    Route::post('/chats/{conversation}/messages', [ConversationMessageController::class, 'store']);
    Route::patch('/chats/{conversation}/messages/{message}', [ConversationMessageController::class, 'update']);
    Route::delete('/chats/{conversation}/messages/{message}', [ConversationMessageController::class, 'destroy']);
    Route::get('/chats/{conversation}/attachments/{attachment}/download', [ConversationAttachmentController::class, 'download']);

    Route::middleware('admin.or.lawyer')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::patch('/users/{id}', [AdminController::class, 'updateUser']);
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::patch('/requests/{id}', [AdminRequestController::class, 'update']);
        Route::get('/analytics', [AdminAnalyticsController::class, 'index']);
        Route::get('/lawyers', [LawyerController::class, 'index']);
        Route::get('/staff', [StaffController::class, 'index']);
        Route::patch('/staff/{id}/specialties', [StaffController::class, 'updateSpecialties']);
        Route::match(['patch', 'post'], '/staff/{id}', [StaffController::class, 'update']);
        Route::get('/specialties', [SpecialtyController::class, 'index']);
        Route::post('/specialties', [SpecialtyController::class, 'store']);
        Route::patch('/specialties/{id}', [SpecialtyController::class, 'update']);
        Route::delete('/specialties/{id}', [SpecialtyController::class, 'destroy']);
        Route::get('/posts', [AdminPostController::class, 'index']);
        Route::post('/posts', [AdminPostController::class, 'store']);
        Route::post('/posts/upload-image', [AdminPostController::class, 'uploadImage']);
        Route::put('/posts/{id}', [AdminPostController::class, 'update']);
        Route::delete('/posts/{id}', [AdminPostController::class, 'destroy']);

        Route::get('/services/meta', [AdminServiceController::class, 'meta']);
        Route::get('/services/manage', [AdminServiceController::class, 'index']);
        Route::post('/services/manage', [AdminServiceController::class, 'store']);
        Route::put('/services/manage/{id}', [AdminServiceController::class, 'update']);
        Route::delete('/services/manage/{id}', [AdminServiceController::class, 'destroy']);
        Route::post('/services/manage/{id}/move', [AdminServiceController::class, 'move']);
    });
});
