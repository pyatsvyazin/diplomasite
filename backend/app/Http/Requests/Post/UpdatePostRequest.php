<?php

namespace App\Http\Requests\Post;

use App\Enums\Post\PostPublishedAs;
use App\Enums\Post\PostStatus;
use App\Enums\Post\PostType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'array'],
            'excerpt' => ['nullable', 'string'],
            'cover_image_url' => ['nullable', 'url', 'max:1024'],
            'cover_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['nullable', 'string', 'max:64'],
            'type' => ['required', Rule::in(array_column(PostType::cases(), 'value'))],
            'status' => ['required', Rule::in(array_column(PostStatus::cases(), 'value'))],
            'published_as' => ['required', Rule::in(array_column(PostPublishedAs::cases(), 'value'))],
            'published_name' => ['nullable', 'string', 'max:255'],
            'is_pinned' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
