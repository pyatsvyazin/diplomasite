<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Post\StorePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Models\Post;
use App\Services\Activity\ActivityLogService;
use App\Services\Post\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function __construct(
        private readonly PostService $postService,
        private readonly ActivityLogService $activityLog,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Post::query()->with('author:id,full_name');
        $type = (string) $request->query('type', '');
        $status = (string) $request->query('status', '');
        $tag = trim(mb_strtolower((string) $request->query('tag', '')));

        if ($type !== '') {
            $query->where('type', $type);
        }
        if ($status !== '') {
            $query->where('status', $status);
        }
        if ($tag !== '') {
            $query->whereJsonContains('keywords', $tag);
        }

        $items = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $actor = $request->user();
        $post = $this->postService->create($request->validated(), (int) $actor->id);
        $this->activityLog->postCreated($actor, $post);

        return response()->json(['data' => $post], 201);
    }

    public function update(UpdatePostRequest $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $actor = $request->user();
        $post = Post::query()->findOrFail($id);
        $oldStatus = $post->status?->value ?? (string) $post->status;
        $updated = $this->postService->update($post, $request->validated());
        $this->activityLog->postUpdated($actor, $updated, $oldStatus);

        return response()->json(['data' => $updated]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $actor = $request->user();
        $post = Post::query()->findOrFail($id);
        $this->activityLog->postDeleted($actor, $post);
        $post->delete();

        return response()->json(['message' => 'Пост удалён.']);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'image' => ['required', 'image', 'max:6144'], // до 6 MB
        ], [
            'image.required' => 'Выберите изображение.',
            'image.image' => 'Файл должен быть изображением.',
            'image.max' => 'Максимальный размер изображения 6 MB.',
        ]);

        $path = $validated['image']->store('posts', 'public');
        $url = url(Storage::disk('public')->url($path));

        return response()->json([
            'data' => [
                'path' => $path,
                'url' => $url,
            ],
        ], 201);
    }

    private function ensureAdmin(Request $request): void
    {
        $isAdmin = $request->user()?->roles()?->where('name', 'admin')->exists();
        abort_if(! $isAdmin, 403, 'Доступ только для администратора.');
    }
}
