<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'city',
        'province',
        'code',
        'address',
        'contact_number',
        'email',
        'is_active',
        'subscription_plan',
        'subscription_expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'subscription_expires_at' => 'datetime',
    ];
    
    protected $appends = ['is_subscribed'];

    public function getIsSubscribedAttribute()
    {
        return $this->subscription_expires_at && $this->subscription_expires_at->isFuture();
    }

    public function subscriptionPayments()
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function assistanceTypes()
    {
        return $this->hasMany(AssistanceType::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
