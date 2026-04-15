<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'date_of_birth',
        'is_senior_citizen',
        'is_pwd',
        'is_low_income',
        'profile_photo',
    ];

    protected $appends = ['profile_photo_url'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'is_senior_citizen' => 'boolean',
            'is_pwd' => 'boolean',
            'is_low_income' => 'boolean',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isBarangayAdmin(): bool
    {
        return $this->role === 'barangay_admin';
    }

    public function isCitizen(): bool
    {
        return $this->role === 'citizen';
    }

    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) {
            return null;
        }
        return $this->date_of_birth->age;
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if ($this->profile_photo) {
            return '/storage/' . $this->profile_photo;
        }

        return null;
    }
}
