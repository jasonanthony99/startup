<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\AssistanceType;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    /**
     * Process a chat message and return a smart response (Bot Mode).
     */
    public function processMessage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $message = strtolower($request->message);
        $user = $request->user();
        $response = "";
        $suggestions = [];

        // 1. Intent: TRACKING
        if ($this->containsAny($message, ['track', 'status', 'where', 'update'])) {
            $latestApp = Application::where('user_id', $user->id)
                ->with('assistanceType')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestApp) {
                $status = str_replace('_', ' ', $latestApp->status);
                $response = "Hi {$user->name}, your latest application for **{$latestApp->assistanceType->name}** is currently **" . strtoupper($status) . "**. ";
                
                if ($latestApp->status === 'under_review') {
                    $response .= "Our team is carefully evaluating your documents. We will notify you once there is an update.";
                } elseif ($latestApp->status === 'approved') {
                    $response .= "Congratulations! Your application has been approved. Please wait for further instructions regarding the release.";
                } elseif ($latestApp->status === 'released') {
                    $response .= "Benefit has been successfully released. Thank you for using our service!";
                }
            } else {
                $response = "It looks like you haven't submitted any applications yet. Would you like to see the available programs?";
                $suggestions = ["Apply for Assistance", "Available Programs"];
            }
        }

        // 2. Intent: PROGRAMS / APPLY
        elseif ($this->containsAny($message, ['program', 'assistance', 'apply', 'types', 'help'])) {
            $types = AssistanceType::all();
            $typeNames = $types->pluck('name')->toArray();
            $response = "We offer several assistance programs to help our residents: " . implode(', ', $typeNames) . ". Which one would you like to know more about?";
            $suggestions = array_slice($typeNames, 0, 3);
        }

        // 3. Intent: SPECIFIC PROGRAM INFO
        elseif ($this->containsAny($message, ['medical', 'financial', 'food', 'educational', 'burial', 'disaster'])) {
            $type = AssistanceType::where('name', 'like', '%' . $this->getProgramFromMessage($message) . '%')->first();
            if ($type) {
                $response = "**{$type->name}**: {$type->description} \n\nTo apply, you'll need to prepare your Brgy Clearance and valid ID. You can start the process in the 'Apply' section.";
                $suggestions = ["Apply Now", "Check Requirements"];
            }
        }

        // 4. Intent: REQUIREMENTS
        elseif ($this->containsAny($message, ['requirement', 'need', 'document', 'prepare'])) {
            $response = "For most programs, you will need to prepare: \n1. Barangay Clearance \n2. Valid Government ID \n3. Certificate of Indigency (if applicable). \n\nSpecific programs might require additional documents like medical records or receipts.";
            $suggestions = ["Apply for Assistance"];
        }

        // 5. Intent: GREETING / DEFAULT
        else {
            $response = "Hello! I'm your Barangay Virtual Assistant. I can help you track your applications, explain our assistance programs, or answer questions about requirements. How can I help you today?";
            $suggestions = ["Talk with Barangay Admin", "Track my application", "How to apply?"];
        }

        return response()->json([
            'response' => $response,
            'suggestions' => $suggestions,
            'timestamp' => now(),
        ]);
    }

    /**
     * Fetch conversation history for the authenticated citizen.
     */
    public function fetchHistory(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $tenantId = $request->user()->tenant_id;

        // Mark admin messages as read for this user
        ChatMessage::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->where('type', 'admin')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = ChatMessage::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->with('sender:id,name,profile_photo')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Send a live message (Citizen to Admin).
     */
    public function sendLiveMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = ChatMessage::create([
            'tenant_id' => $request->user()->tenant_id,
            'user_id' => $request->user()->id,
            'sender_id' => $request->user()->id,
            'message' => $validated['message'],
            'type' => 'citizen',
        ]);

        return response()->json([
            'message' => $message->load('sender:id,name,profile_photo'),
        ], 201);
    }

    /**
     * [ADMIN] Get all citizens who have sent messages.
     */
    public function getSessions(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $sessions = ChatMessage::where('tenant_id', $tenantId)
            ->select('user_id')
            ->distinct()
            ->with(['user' => function($query) {
                $query->select('id', 'name', 'email', 'profile_photo');
            }])
            ->get();

        // Get latest message for each session and unread count
        $sessions->map(function($session) use ($tenantId) {
            $session->latest_message = ChatMessage::where('user_id', $session->user_id)
                ->where('tenant_id', $tenantId)
                ->orderBy('created_at', 'desc')
                ->first();

            $session->unread_count = ChatMessage::where('user_id', $session->user_id)
                ->where('tenant_id', $tenantId)
                ->where('type', 'citizen')
                ->where('is_read', false)
                ->count();
                
            return $session;
        });

        return response()->json(['sessions' => $sessions]);
    }

    /**
     * [ADMIN] Fetch history for a specific citizen.
     */
    public function fetchAdminHistory(Request $request, $userId): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        // Mark citizen messages as read for this session (as admin is viewing)
        ChatMessage::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->where('type', 'citizen')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = ChatMessage::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->with('sender:id,name,profile_photo')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * [ADMIN] Send a message to a citizen.
     */
    public function sendAdminMessage(Request $request, $userId): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = ChatMessage::create([
            'tenant_id' => $request->user()->tenant_id,
            'user_id' => $userId,
            'sender_id' => $request->user()->id,
            'message' => $validated['message'],
            'type' => 'admin',
        ]);

        return response()->json([
            'message' => $message->load('sender:id,name,profile_photo'),
        ], 201);
    }

    /**
     * Get unread counts for the dashboard indicators.
     */
    public function getUnreadCounts(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        if ($user->role === 'citizen') {
            $count = ChatMessage::where('user_id', $user->id)
                ->where('tenant_id', $tenantId)
                ->where('type', 'admin')
                ->where('is_read', false)
                ->count();
            
            return response()->json(['unread_count' => $count]);
        } 
        
        // For Admins: Show count of UNIQUE citizens with unread messages
        $count = ChatMessage::where('tenant_id', $tenantId)
            ->where('type', 'citizen')
            ->where('is_read', false)
            ->distinct('user_id')
            ->count('user_id');

        return response()->json(['unread_count' => $count]);
    }

    /**
     * Helper to check if string contains any of the keywords.
     */
    private function containsAny($str, array $keywords)
    {
        foreach ($keywords as $keyword) {
            if (str_contains($str, $keyword)) return true;
        }
        return false;
    }

    /**
     * Helper to extract program name from message.
     */
    private function getProgramFromMessage($message)
    {
        $programs = ['medical', 'financial', 'food', 'educational', 'burial', 'disaster'];
        foreach ($programs as $p) {
            if (str_contains($message, $p)) return $p;
        }
        return "";
    }
}
