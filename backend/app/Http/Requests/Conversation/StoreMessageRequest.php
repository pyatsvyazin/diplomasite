<?php

namespace App\Http\Requests\Conversation;

use App\Enums\Chat\MessageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $conversation = $this->route('conversation');

        return $conversation && $this->user()->can('sendMessage', $conversation);
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in([MessageType::Text->value, MessageType::Image->value, MessageType::File->value])],
            'content' => ['nullable', 'string', 'max:10000'],
            'file' => ['nullable', 'file', 'max:51200'],
            'reply_to_message_id' => ['nullable', 'integer', 'exists:messages,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $type = $this->input('type');
            if ($type === MessageType::Text->value) {
                if (!is_string($this->input('content')) || trim($this->input('content')) === '') {
                    $validator->errors()->add('content', 'Введите текст сообщения.');
                }
            }
            if (in_array($type, [MessageType::Image->value, MessageType::File->value], true) && !$this->hasFile('file')) {
                $validator->errors()->add('file', 'Прикрепите файл.');
            }
            $replyToMessageId = $this->input('reply_to_message_id');
            $conversation = $this->route('conversation');
            if ($replyToMessageId && $conversation) {
                $sameConversationReply = \App\Models\Message::query()
                    ->whereKey($replyToMessageId)
                    ->where('conversation_id', $conversation->id)
                    ->exists();
                if (!$sameConversationReply) {
                    $validator->errors()->add('reply_to_message_id', 'Можно отвечать только на сообщение из этого чата.');
                }
            }
        });
    }
}
