<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatusLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'changed_by',
        'from_status',
        'to_status',
        'remarks',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
