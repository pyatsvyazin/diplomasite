<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\Request as ClientRequest;
use App\Models\User;

class MeetingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Meeting $meeting): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $request = $meeting->request;
        if (!$request) {
            return false;
        }

        if ($request->client_id === $user->id) {
            return true;
        }

        if ((int) $meeting->responsible_lawyer_id === (int) $user->id) {
            return true;
        }

        return false;
    }

    public function create(User $user, ClientRequest $request): bool
    {
        if (!$this->isAdmin($user) && !$this->isLawyer($user)) {
            return false;
        }

        if (!$request->lawyer_id) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return !in_array($request->status, [ClientRequest::STATUS_CLOSED, ClientRequest::STATUS_REJECTED], true);
        }

        if ((int) $request->lawyer_id !== (int) $user->id) {
            return false;
        }

        return !in_array($request->status, [ClientRequest::STATUS_CLOSED, ClientRequest::STATUS_REJECTED], true);
    }

    public function update(User $user, Meeting $meeting): bool
    {
        return $this->isAdmin($user)
            || ($this->isLawyer($user) && (int) $meeting->responsible_lawyer_id === (int) $user->id);
    }

    public function confirm(User $user, Meeting $meeting): bool
    {
        return $meeting->request?->client_id === $user->id;
    }

    public function cancel(User $user, Meeting $meeting): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($meeting->request?->client_id === $user->id) {
            return true;
        }

        return $this->isLawyer($user) && (int) $meeting->responsible_lawyer_id === (int) $user->id;
    }

    public function complete(User $user, Meeting $meeting): bool
    {
        return $this->update($user, $meeting);
    }

    private function isAdmin(User $user): bool
    {
        return $user->roles()->where('name', 'admin')->exists();
    }

    private function isLawyer(User $user): bool
    {
        return $user->roles()->where('name', 'lawyer')->exists();
    }
}
