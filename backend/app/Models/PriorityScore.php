<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriorityScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'is_senior',
        'is_pwd',
        'is_low_income',
        'age_score',
        'total_score',
    ];

    protected $casts = [
        'is_senior' => 'boolean',
        'is_pwd' => 'boolean',
        'is_low_income' => 'boolean',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
