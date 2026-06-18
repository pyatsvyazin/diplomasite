<?php

namespace App\Http\Controllers\Api;

use App\Enums\Post\PostStatus;
use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Post::query()->with('author:id,full_name');
        $type = (string) $request->query('type', '');
        $tag = trim(mb_strtolower((string) $request->query('tag', '')));
        $search = trim(mb_strtolower((string) $request->query('q', '')));

        if ($type !== '') {
            $query->where('type', $type);
        }
        $query->where('status', PostStatus::Published->value);
        if ($tag !== '') {
            $query->whereJsonContains('keywords', $tag);
        }
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($search, $like) {
                $q->whereRaw('LOWER(title) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(COALESCE(excerpt, "")) LIKE ?', [$like])
                    ->orWhereJsonContains('keywords', $search);
            });
        }

        $perPage = min(50, max(1, (int) $request->query('per_page', 12)));
        $page = max(1, (int) $request->query('page', 1));

        $paginator = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function related(Request $request, string $slug): JsonResponse
    {
        $post = Post::query()
            ->where('slug', $slug)
            ->where('status', PostStatus::Published->value)
            ->firstOrFail();

        $tags = array_values(array_filter((array) ($post->keywords ?? [])));

        if ($tags === []) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 3,
                    'total' => 0,
                ],
            ]);
        }

        $query = Post::query()
            ->with('author:id,full_name')
            ->where('status', PostStatus::Published->value)
            ->where('id', '!=', $post->id)
            ->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('keywords', $tag);
                }
            });

        $perPage = min(10, max(1, (int) $request->query('per_page', 3)));
        $page = max(1, (int) $request->query('page', 1));

        $paginator = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = Post::query()
            ->with('author:id,full_name')
            ->where('slug', $slug)
            ->where('status', PostStatus::Published->value)
            ->firstOrFail();

        return response()->json(['data' => $post]);
    }
}
