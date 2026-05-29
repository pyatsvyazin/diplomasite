<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'email_verified_at',
        'phone',
        'avatar_path',
        'password',
        'is_blocked',
        'two_factor_enabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'password' => 'hashed',
        'is_blocked' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'email_verified_at' => 'datetime',
    ];

    /**
     * В БД храним только цифры (11 цифр, начинается с 7).
     */
    public function setPhoneAttribute($value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['phone'] = null;
            return;
        }
        $digits = preg_replace('/\D/', '', (string) $value);
        if (strlen($digits) === 10) {
            $digits = '7' . $digits;
        } elseif (strlen($digits) === 11 && $digits[0] === '8') {
            $digits = '7' . substr($digits, 1);
        }
        $this->attributes['phone'] = $digits !== '' ? $digits : null;
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    /** Специализации юриста (только для пользователей с ролью lawyer). */
    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(Specialty::class, 'lawyer_specialty', 'user_id', 'specialty_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function conversationParticipations(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
