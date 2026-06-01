<?php

namespace App\Models;

use App\Enums\ServicePriceType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name',
        'short_description',
        'full_description',
        'category',
        'price_type',
        'price_from',
        'price_to',
        'priority',
    ];

    protected $casts = [
        'price_type' => ServicePriceType::class,
        'priority' => 'integer',
        'price_from' => 'integer',
        'price_to' => 'integer',
    ];

    protected $appends = [
        'formatted_price',
    ];

    public function getFormattedPriceAttribute(): string
    {
        $type = $this->price_type instanceof ServicePriceType
            ? $this->price_type
            : ServicePriceType::tryFrom((string) ($this->attributes['price_type'] ?? ''))
                ?? ServicePriceType::Custom;

        return match ($type) {
            ServicePriceType::Fixed => $this->price_from !== null
                ? $this->formatRubles($this->price_from)
                : '—',
            ServicePriceType::From => $this->price_from !== null
                ? 'от '.$this->formatRubles($this->price_from)
                : '—',
            ServicePriceType::Range => $this->price_from !== null && $this->price_to !== null
                ? $this->formatRubles($this->price_from).' – '.$this->formatRubles($this->price_to)
                : '—',
            ServicePriceType::Custom => 'по договоренности',
        };
    }

    protected function formatRubles(int $amount): string
    {
        return number_format($amount, 0, ',', ' ').' ₽';
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('priority')->orderBy('name');
    }
}
