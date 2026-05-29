<?php

namespace App\Models;

use App\Enums\Post\PostPublishedAs;
use App\Enums\Post\PostStatus;
use App\Enums\Post\PostType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'cover_image_url',
        'cover_color',
        'keywords',
        'type',
        'status',
        'author_id',
        'published_as',
        'published_name',
        'is_pinned',
        'published_at',
    ];

    protected $casts = [
        'content' => 'array',
        'keywords' => 'array',
        'type' => PostType::class,
        'status' => PostStatus::class,
        'published_as' => PostPublishedAs::class,
        'is_pinned' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = ['published_name'];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function getPublishedNameAttribute(): ?string
    {
        $mode = $this->published_as instanceof PostPublishedAs
            ? $this->published_as
            : PostPublishedAs::tryFrom((string) ($this->attributes['published_as'] ?? 'author'));

        return match ($mode) {
            PostPublishedAs::Author => $this->author?->full_name,
            PostPublishedAs::Company => 'Юридическая компания',
            PostPublishedAs::Custom => $this->attributes['published_name'] ?? null,
            default => $this->author?->full_name,
        };
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PostStatus::Published->value);
    }
}
