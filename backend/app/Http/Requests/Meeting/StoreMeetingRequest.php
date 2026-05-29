<?php

namespace App\Http\Requests\Meeting;

use App\Enums\Meeting\MeetingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'meeting_type' => ['required', Rule::in(array_column(MeetingType::cases(), 'value'))],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'location' => ['nullable', 'string', 'max:512'],
            'meeting_link' => ['nullable', 'string', 'max:1024'],
            'responsible_lawyer_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
