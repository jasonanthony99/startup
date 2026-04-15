<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'document_type_id',
        'reference_id',
        'purpose',
        'status',
        'payment_method',
        'payment_status',
        'amount',
        'payment_reference',
        'pickup_date',
        'admin_remarks',
        'paid_at',
        'processed_at',
        'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'pickup_date' => 'date',
        'paid_at' => 'datetime',
        'processed_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    /**
     * Generate a unique reference ID for the document request.
     */
    public static function generateReferenceId(int $tenantId): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        return "DOC-{$tenantId}-{$date}-{$random}";
    }
}
