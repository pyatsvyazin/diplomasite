<?php

namespace App\Providers;

use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Meeting;
use App\Models\Message;
use App\Policies\AttachmentPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\MeetingPolicy;
use App\Policies\MessagePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Conversation::class => ConversationPolicy::class,
        Attachment::class => AttachmentPolicy::class,
        Message::class => MessagePolicy::class,
        Meeting::class => MeetingPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
