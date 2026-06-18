<?php

namespace App\Support;

use App\Events\StaffMeetingUpdated;
use App\Events\StaffRequestUpdated;
use App\Models\Meeting;
use App\Models\Request as ClientRequest;

final class StaffBroadcast
{
    public static function request(ClientRequest|int $request): void
    {
        if (config('broadcasting.default') === 'null') {
            return;
        }

        $requestId = $request instanceof ClientRequest ? $request->id : $request;

        dispatch(function () use ($requestId): void {
            try {
                $fresh = ClientRequest::query()
                    ->with(['client', 'lawyer', 'review', 'review.lawyer'])
                    ->find($requestId);

                if (!$fresh) {
                    return;
                }

                broadcast(new StaffRequestUpdated($fresh));
            } catch (\Throwable $e) {
                report($e);
            }
        })->afterResponse();
    }

    public static function meeting(Meeting|int $meeting, string $action = 'updated'): void
    {
        if (config('broadcasting.default') === 'null') {
            return;
        }

        $meetingId = $meeting instanceof Meeting ? $meeting->id : $meeting;

        dispatch(function () use ($meetingId, $action): void {
            try {
                $fresh = Meeting::query()->find($meetingId);
                if (!$fresh) {
                    return;
                }

                broadcast(new StaffMeetingUpdated($fresh, $action));
            } catch (\Throwable $e) {
                report($e);
            }
        })->afterResponse();
    }
}
