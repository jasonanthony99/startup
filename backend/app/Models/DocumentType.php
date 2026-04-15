<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'fee',
        'requirements',
        'processing_time',
        'is_active',
    ];

    protected $casts = [
        'fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function documentRequests()
    {
        return $this->hasMany(DocumentRequest::class);
    }
}
