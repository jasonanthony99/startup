<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'sender_id',
        'message',
        'type',
        'is_read',
    ];

    /**
     * The citizen this conversation belongs to.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The actual sender of this specific message.
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
