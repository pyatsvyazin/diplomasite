<?php

namespace App\Enums;

enum ServicePriceType: string
{
    case Fixed = 'fixed';
    case From = 'from';
    case Range = 'range';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Fixed => 'фиксированная цена',
            self::From => 'цена «от»',
            self::Range => 'диапазон',
            self::Custom => 'по договорённости',
        };
    }
}
