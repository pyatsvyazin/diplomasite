<?php

namespace App\Enums\Post;

enum PostType: string
{
    case Article = 'article';
    case News = 'news';
    case Page = 'page';
}
