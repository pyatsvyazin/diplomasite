<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use App\Mail\Concerns\UsesAppMailSender;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationLink extends Mailable
{
    use Queueable, SerializesModels, UsesAppMailSender;

    public function __construct(
        public string $verifyUrl,
        public string $userName
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Подтверждение адреса почты',
            from: $this->appMailFrom(),
            replyTo: [$this->appMailFrom()],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.email-verification'
        );
    }
}
