<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use App\Mail\Concerns\UsesAppMailSender;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordChangeCode extends Mailable
{
    use Queueable, SerializesModels, UsesAppMailSender;

    public function __construct(
        public string $code
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Код для смены пароля',
            from: $this->appMailFrom(),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-change-code'
        );
    }
}
