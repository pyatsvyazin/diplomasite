<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Specialty extends Model
{
    protected $fillable = ['name'];

    public function lawyers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lawyer_specialty', 'specialty_id', 'user_id');
    }
}
