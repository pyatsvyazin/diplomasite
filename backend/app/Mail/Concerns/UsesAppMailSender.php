<?php

namespace App\Mail\Concerns;

use Illuminate\Mail\Mailables\Address;

trait UsesAppMailSender
{
    protected function appMailFrom(): Address
    {
        return new Address(
            (string) config('mail.from.address'),
            (string) config('mail.from.name', config('app.name', 'Юридический щит')),
        );
    }
}
