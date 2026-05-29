<?php

namespace App\Enums\Post;

enum PostPublishedAs: string
{
    case Author = 'author';
    case Company = 'company';
    case Custom = 'custom';
}
