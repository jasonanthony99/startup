<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the tenant scope to all queries.
     * Super admins bypass the scope to see all tenants' data.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && auth()->user()->role !== 'super_admin') {
            $builder->where($model->getTable() . '.tenant_id', auth()->user()->tenant_id);
        }
    }
}
