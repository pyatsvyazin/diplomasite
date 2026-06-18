<?php

namespace App\Events;

use App\Models\Meeting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StaffMeetingUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Meeting $meeting,
        public string $action = 'updated',
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('staff')];
    }

    public function broadcastAs(): string
    {
        return 'meeting.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->meeting->loadMissing(['request:id,subject,status,client_id,lawyer_id', 'responsibleLawyer:id,full_name']);

        return [
            'action' => $this->action,
            'request_id' => $this->meeting->request_id,
            'meeting_id' => $this->meeting->id,
            'meeting' => [
                'id' => $this->meeting->id,
                'request_id' => $this->meeting->request_id,
                'title' => $this->meeting->title,
                'status' => $this->meeting->status?->value ?? $this->meeting->status,
                'start_at' => $this->meeting->start_at?->toIso8601String(),
                'end_at' => $this->meeting->end_at?->toIso8601String(),
                'meeting_type' => $this->meeting->meeting_type?->value ?? $this->meeting->meeting_type,
                'formatted_date' => $this->meeting->formatted_date,
                'formatted_status' => $this->meeting->formatted_status,
            ],
        ];
    }
}
