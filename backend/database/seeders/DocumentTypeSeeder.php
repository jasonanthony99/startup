<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        $types = [
            [
                'name' => 'Barangay Clearance',
                'description' => 'General purpose clearance certifying that the holder is a resident of good moral character with no derogatory record in the barangay.',
                'fee' => 50.00,
                'requirements' => 'Valid ID, 1x1 Photo, Cedula',
                'processing_time' => '1-2 business days',
            ],
            [
                'name' => 'Certificate of Indigency',
                'description' => 'Certifies that the holder belongs to an indigent family for availing government assistance, medical aid, or scholarship programs.',
                'fee' => 0.00,
                'requirements' => 'Valid ID, Proof of Residency',
                'processing_time' => '1 business day',
            ],
            [
                'name' => 'Certificate of Residency',
                'description' => 'Certifies that the holder is a bonafide resident of the barangay for employment, school enrollment, or legal purposes.',
                'fee' => 30.00,
                'requirements' => 'Valid ID, Proof of Billing',
                'processing_time' => '1-2 business days',
            ],
            [
                'name' => 'Barangay ID',
                'description' => 'Official barangay identification card for residents. Valid for 3 years.',
                'fee' => 75.00,
                'requirements' => 'Valid Government ID, 2x2 Photo (2 copies), Proof of Residency',
                'processing_time' => '3-5 business days',
            ],
            [
                'name' => 'Certificate of Good Moral Character',
                'description' => 'Certifies the holder\'s good moral standing within the community. Commonly required for employment and school applications.',
                'fee' => 30.00,
                'requirements' => 'Valid ID, 1x1 Photo',
                'processing_time' => '1-2 business days',
            ],
            [
                'name' => 'Business Permit Clearance',
                'description' => 'Barangay endorsement required before applying for a municipal/city business permit.',
                'fee' => 150.00,
                'requirements' => 'Valid ID, DTI Registration, Proof of Business Address',
                'processing_time' => '2-3 business days',
            ],
            [
                'name' => 'Certificate of No Pending Case',
                'description' => 'Certifies that the holder has no pending case or complaint filed in the Barangay Lupon/Justice system.',
                'fee' => 30.00,
                'requirements' => 'Valid ID',
                'processing_time' => '1 business day',
            ],
        ];

        foreach ($tenants as $tenant) {
            foreach ($types as $type) {
                DocumentType::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'name' => $type['name']],
                    [...$type, 'tenant_id' => $tenant->id]
                );
            }
        }
    }
}
