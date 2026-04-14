<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'assistance_type_id',
        'reference_id',
        'purpose',
        'requirements_path',
        'status',
        'priority_level',
        'queue_position',
        'admin_remarks',
        'reviewed_at',
        'reviewed_by',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assistanceType()
    {
        return $this->belongsTo(AssistanceType::class);
    }

    public function priorityScore()
    {
        return $this->hasOne(PriorityScore::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(StatusLog::class)->orderBy('created_at', 'desc');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Generate a unique reference ID for the application.
     */
    public static function generateReferenceId(int $tenantId): string
    {
        $prefix = 'BRG';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        return "{$prefix}-{$tenantId}-{$date}-{$random}";
    }
}
