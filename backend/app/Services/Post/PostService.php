<?php

namespace App\Services\Post;

use App\Enums\Post\PostPublishedAs;
use App\Enums\Post\PostStatus;
use App\Models\Post;
use Illuminate\Support\Str;

class PostService
{
    public function create(array $payload, int $authorId): Post
    {
        $payload['author_id'] = $authorId;
        $payload['slug'] = $this->resolveSlug($payload['slug'] ?? null, $payload['title']);
        $payload['published_at'] = $this->resolvePublishedAt(
            $payload['status'] ?? PostStatus::Draft->value,
            $payload['published_at'] ?? null
        );
        $payload['published_name'] = $this->resolvePublishedName($payload);
        $payload['keywords'] = $this->resolveKeywords($payload['keywords'] ?? []);

        return Post::query()->create($payload)->load('author');
    }

    public function update(Post $post, array $payload): Post
    {
        $title = $payload['title'] ?? $post->title;
        $payload['slug'] = $this->resolveSlug($payload['slug'] ?? $post->slug, $title, $post->id);
        $payload['published_at'] = $this->resolvePublishedAt(
            $payload['status'] ?? $post->status->value,
            $payload['published_at'] ?? $post->published_at
        );
        $payload['published_name'] = $this->resolvePublishedName(array_merge($post->toArray(), $payload));
        $payload['keywords'] = $this->resolveKeywords($payload['keywords'] ?? $post->keywords ?? []);

        $post->fill($payload);
        $post->save();

        return $post->load('author');
    }

    private function resolveSlug(?string $slug, string $title, ?int $ignorePostId = null): string
    {
        $base = Str::slug(trim((string) ($slug ?: $title)));
        if ($base === '') {
            $base = 'post';
        }
        $candidate = $base;
        $index = 1;

        while ($this->slugExists($candidate, $ignorePostId)) {
            $index++;
            $candidate = $base.'-'.$index;
        }

        return $candidate;
    }

    private function slugExists(string $slug, ?int $ignorePostId = null): bool
    {
        $query = Post::query()->where('slug', $slug);
        if ($ignorePostId !== null) {
            $query->where('id', '!=', $ignorePostId);
        }

        return $query->exists();
    }

    private function resolvePublishedAt(string $status, mixed $publishedAt): mixed
    {
        if ($status !== PostStatus::Published->value) {
            return $publishedAt;
        }

        return $publishedAt ?: now();
    }

    private function resolvePublishedName(array $payload): ?string
    {
        $publishedAs = (string) ($payload['published_as'] ?? PostPublishedAs::Author->value);
        if ($publishedAs !== PostPublishedAs::Custom->value) {
            return null;
        }

        $name = trim((string) ($payload['published_name'] ?? ''));

        return $name !== '' ? $name : null;
    }

    private function resolveKeywords(array $keywords): array
    {
        $normalized = [];
        foreach ($keywords as $item) {
            $value = trim((string) $item);
            if ($value === '') {
                continue;
            }
            $normalized[] = mb_strtolower($value);
        }

        return array_values(array_unique($normalized));
    }
}
