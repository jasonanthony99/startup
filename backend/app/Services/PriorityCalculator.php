<?php

namespace App\Services;

use App\Models\Application;
use App\Models\PriorityScore;
use App\Models\User;

class PriorityCalculator
{
    /**
     * Calculate priority score for an application based on the applicant's profile.
     *
     * Scoring:
     *   Senior Citizen: +30
     *   PWD:            +25
     *   Low Income:     +20
     *   Age Bonus:      max(0, (age - 60) * 2)
     *
     * Priority Levels:
     *   Score >= 50 → Level 1 (HIGH)
     *   Score >= 25 → Level 2 (MEDIUM)
     *   Score < 25  → Level 3 (NORMAL)
     */
    public function calculate(Application $application): PriorityScore
    {
        $user = $application->user;

        $isSenior = $user->is_senior_citizen;
        $isPwd = $user->is_pwd;
        $isLowIncome = $user->is_low_income;

        $ageScore = 0;
        if ($user->age && $user->age > 60) {
            $ageScore = ($user->age - 60) * 2;
        }

        $totalScore = 0;
        $totalScore += $isSenior ? 30 : 0;
        $totalScore += $isPwd ? 25 : 0;
        $totalScore += $isLowIncome ? 20 : 0;
        $totalScore += $ageScore;

        // Determine priority level
        $priorityLevel = 3; // NORMAL
        if ($totalScore >= 50) {
            $priorityLevel = 1; // HIGH
        } elseif ($totalScore >= 25) {
            $priorityLevel = 2; // MEDIUM
        }

        // Update application priority level
        $application->update(['priority_level' => $priorityLevel]);

        // Create or update priority score record
        $priorityScore = PriorityScore::updateOrCreate(
            ['application_id' => $application->id],
            [
                'is_senior' => $isSenior,
                'is_pwd' => $isPwd,
                'is_low_income' => $isLowIncome,
                'age_score' => $ageScore,
                'total_score' => $totalScore,
            ]
        );

        return $priorityScore;
    }

    /**
     * Get priority label from level.
     */
    public static function getLevelLabel(int $level): string
    {
        return match ($level) {
            1 => 'HIGH',
            2 => 'MEDIUM',
            default => 'NORMAL',
        };
    }
}
