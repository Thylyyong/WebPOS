<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Get available roles for the Splash Screen portal
     */
    public function roles()
    {
        $users = User::with('branch')
            ->where('is_active', true)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'role' => $u->role,
                    'branch_id' => $u->branch_id,
                    'branch_name' => $u->branch?->branch_name ?? 'Global Enterprise',
                ];
            });

        return response()->json([
            'success' => true,
            'roles' => $users,
        ]);
    }

    /**
     * Quick PIN-based authentication from Splash Screen
     */
    public function loginWithPin(Request $request)
    {
        $request->validate([
            'pin_code' => 'required|string',
            'username' => 'nullable|string',
        ]);

        $query = User::with('branch')->where('is_active', true);

        if ($request->filled('username')) {
            $query->where('username', $request->username);
        }

        $user = $query->where('pin_code', $request->pin_code)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN code. Please try again.',
            ], 401);
        }

        $token = $user->createToken('pos_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentication successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch?->branch_name ?? 'Global Enterprise',
                'is_main_boss' => $user->isMainBoss(),
                'is_sub_boss' => $user->isSubBoss(),
                'is_cashier' => $user->isCashier(),
            ],
        ]);
    }

    /**
     * Switch branch context (accessible by Main Boss)
     */
    public function switchBranch(Request $request)
    {
        if (! $request->user()->isMainBoss()) {
            abort(403, 'Only Boss can switch branches.');
        }

        $request->validate([
            'branch_id' => 'required|string|exists:branches,id',
        ]);

        $branch = Branch::findOrFail($request->branch_id);

        return response()->json([
            'success' => true,
            'message' => "Switched active branch to {$branch->branch_name}",
            'branch' => $branch,
        ]);
    }

    /**
     * Current authenticated user profile
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->load('branch');
        }

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    /**
     * Logout & invalidate token
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
