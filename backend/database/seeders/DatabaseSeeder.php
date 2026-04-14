<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\AssistanceType;
use App\Models\Notification;
use App\Models\PriorityScore;
use App\Models\StatusLog;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PriorityCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $priorityCalculator = new PriorityCalculator();

        // ── Super Admin ─────────────────────────────────────────────────────
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@barangay.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'tenant_id' => null,
        ]);

        // ── Tenant 1: Barangay San Isidro ───────────────────────────────────
        $tenant1 = Tenant::create([
            'name' => 'Barangay San Isidro',
            'code' => 'SAN-ISIDRO',
            'address' => '123 Main Street, San Isidro, Manila',
            'contact_number' => '(02) 8123-4567',
            'email' => 'sanisidro@barangay.gov.ph',
        ]);

        $admin1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Kapitan Juan Dela Cruz',
            'email' => 'admin@sanisidro.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'barangay_admin',
        ]);

        // Default assistance types for Tenant 1
        $types1 = [];
        $typeData = [
            ['name' => 'Medical Assistance', 'description' => 'Financial aid for medical needs, hospital bills, and medicines.'],
            ['name' => 'Financial Assistance', 'description' => 'General financial support for families in need.'],
            ['name' => 'Food Assistance', 'description' => 'Food packs and grocery support for families.'],
            ['name' => 'Educational Assistance', 'description' => 'Support for school supplies, tuition, and educational needs.'],
            ['name' => 'Burial Assistance', 'description' => 'Financial aid for burial and funeral expenses.'],
            ['name' => 'Disaster Relief', 'description' => 'Emergency assistance during natural disasters and calamities.'],
        ];

        foreach ($typeData as $type) {
            $types1[] = AssistanceType::create([
                'tenant_id' => $tenant1->id,
                'name' => $type['name'],
                'description' => $type['description'],
            ]);
        }

        // Citizens for Tenant 1
        $citizens1 = [
            [
                'name' => 'Maria Santos',
                'email' => 'maria.santos@email.com',
                'phone' => '09171234567',
                'address' => '45 Rizal Street, San Isidro',
                'date_of_birth' => '1955-03-15',
                'is_senior_citizen' => true,
                'is_pwd' => false,
                'is_low_income' => true,
            ],
            [
                'name' => 'Pedro Reyes',
                'email' => 'pedro.reyes@email.com',
                'phone' => '09181234567',
                'address' => '78 Mabini Avenue, San Isidro',
                'date_of_birth' => '1990-07-22',
                'is_senior_citizen' => false,
                'is_pwd' => true,
                'is_low_income' => true,
            ],
            [
                'name' => 'Ana Garcia',
                'email' => 'ana.garcia@email.com',
                'phone' => '09191234567',
                'address' => '12 Bonifacio Lane, San Isidro',
                'date_of_birth' => '1988-11-05',
                'is_senior_citizen' => false,
                'is_pwd' => false,
                'is_low_income' => false,
            ],
            [
                'name' => 'Roberto Cruz',
                'email' => 'roberto.cruz@email.com',
                'phone' => '09201234567',
                'address' => '34 Luna Street, San Isidro',
                'date_of_birth' => '1948-01-30',
                'is_senior_citizen' => true,
                'is_pwd' => true,
                'is_low_income' => true,
            ],
            [
                'name' => 'Elena Bautista',
                'email' => 'elena.bautista@email.com',
                'phone' => '09211234567',
                'address' => '56 Del Pilar Road, San Isidro',
                'date_of_birth' => '1992-06-18',
                'is_senior_citizen' => false,
                'is_pwd' => false,
                'is_low_income' => true,
            ],
        ];

        $createdCitizens = [];
        foreach ($citizens1 as $citizenData) {
            $createdCitizens[] = User::create(array_merge($citizenData, [
                'tenant_id' => $tenant1->id,
                'password' => Hash::make('password123'),
                'role' => 'citizen',
            ]));
        }

        // Sample applications for Tenant 1
        $statuses = ['pending', 'under_review', 'approved', 'released', 'rejected'];
        $sampleApps = [
            ['citizen' => 0, 'type' => 0, 'status' => 'released', 'purpose' => 'Need help with hospital bills for hypertension treatment.'],
            ['citizen' => 0, 'type' => 2, 'status' => 'approved', 'purpose' => 'Request for food assistance during recovery period.'],
            ['citizen' => 1, 'type' => 1, 'status' => 'under_review', 'purpose' => 'Financial aid for wheelchair repair and maintenance.'],
            ['citizen' => 2, 'type' => 3, 'status' => 'pending', 'purpose' => 'Educational assistance for children school supplies.'],
            ['citizen' => 3, 'type' => 0, 'status' => 'approved', 'purpose' => 'Medical assistance for regular check-ups and medications.'],
            ['citizen' => 3, 'type' => 1, 'status' => 'released', 'purpose' => 'Financial support for daily living expenses.'],
            ['citizen' => 4, 'type' => 2, 'status' => 'pending', 'purpose' => 'Food pack request for family of 5.'],
            ['citizen' => 4, 'type' => 1, 'status' => 'rejected', 'purpose' => 'Financial assistance request - duplicate.'],
        ];

        $queuePosition = 1;
        foreach ($sampleApps as $index => $appData) {
            $citizen = $createdCitizens[$appData['citizen']];
            $referenceId = Application::generateReferenceId($tenant1->id);

            $application = Application::create([
                'tenant_id' => $tenant1->id,
                'user_id' => $citizen->id,
                'assistance_type_id' => $types1[$appData['type']]->id,
                'reference_id' => $referenceId,
                'purpose' => $appData['purpose'],
                'status' => $appData['status'],
                'reviewed_at' => in_array($appData['status'], ['approved', 'released', 'rejected']) ? now()->subDays(rand(1, 15)) : null,
                'reviewed_by' => in_array($appData['status'], ['approved', 'released', 'rejected']) ? $admin1->id : null,
                'queue_position' => in_array($appData['status'], ['approved', 'under_review']) ? $queuePosition++ : null,
                'created_at' => now()->subDays(rand(1, 30)),
            ]);

            // Calculate priority
            $priorityCalculator->calculate($application);

            // Create status log
            StatusLog::create([
                'application_id' => $application->id,
                'changed_by' => $citizen->id,
                'from_status' => null,
                'to_status' => 'pending',
                'remarks' => 'Application submitted.',
                'created_at' => $application->created_at,
            ]);

            if ($appData['status'] !== 'pending') {
                StatusLog::create([
                    'application_id' => $application->id,
                    'changed_by' => $admin1->id,
                    'from_status' => 'pending',
                    'to_status' => $appData['status'],
                    'remarks' => $appData['status'] === 'rejected'
                        ? 'Duplicate application. Previous request already processed.'
                        : 'Application reviewed and processed.',
                    'created_at' => $application->reviewed_at ?? now(),
                ]);
            }

            // Notification
            Notification::create([
                'user_id' => $citizen->id,
                'tenant_id' => $tenant1->id,
                'title' => 'Application Submitted',
                'message' => "Your application {$referenceId} has been submitted.",
                'type' => 'status_update',
                'is_read' => true,
            ]);
        }

        // ── Tenant 2: Barangay Bagong Silang ────────────────────────────────
        $tenant2 = Tenant::create([
            'name' => 'Barangay Bagong Silang',
            'code' => 'BAGONG-SILANG',
            'address' => '456 National Highway, Bagong Silang, Quezon City',
            'contact_number' => '(02) 8765-4321',
            'email' => 'bagongsilang@barangay.gov.ph',
        ]);

        User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Kapitan Rosa Mendoza',
            'email' => 'admin@bagongsilang.gov.ph',
            'password' => Hash::make('password123'),
            'role' => 'barangay_admin',
        ]);

        foreach ($typeData as $type) {
            AssistanceType::create([
                'tenant_id' => $tenant2->id,
                'name' => $type['name'],
                'description' => $type['description'],
            ]);
        }

        echo "Database seeded successfully!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Super Admin:  superadmin@barangay.gov.ph / password123\n";
        echo "Brgy Admin 1: admin@sanisidro.gov.ph / password123\n";
        echo "Brgy Admin 2: admin@bagongsilang.gov.ph / password123\n";
        echo "Citizen:      maria.santos@email.com / password123\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
