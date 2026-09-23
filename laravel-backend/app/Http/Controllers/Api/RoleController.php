<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class RoleController extends Controller
{
    /**
     * List all defined roles with user counts
     */
    public function roles()
    {
        $roles = Role::withCount('users')->get();

        return response()->json([
            'success' => true,
            'roles' => $roles,
        ]);
    }

    /**
     * Create a new custom role (Admin/Boss only)
     */
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:roles,code',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
        ]);

        $codeUpper = strtoupper(preg_replace('/[^A-Za-z0-9_]/', '_', $validated['code']));

        $role = Role::create([
            'id' => 'role_' . strtolower(Str::slug($codeUpper, '_')),
            'name' => $validated['name'],
            'code' => $codeUpper,
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'] ?? ['pos', 'tables'],
            'is_system' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' created successfully",
            'role' => $role,
        ], 201);
    }

    /**
     * Update an existing role definition
     */
    public function updateRole(Request $request, string $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
        ]);

        $role->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' updated successfully",
            'role' => $role,
        ]);
    }

    /**
     * Delete custom role
     */
    public function destroyRole(string $id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => "System role '{$role->name}' cannot be deleted.",
            ], 422);
        }

        $assignedCount = User::where('role', $role->code)->count();
        if ($assignedCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete role '{$role->name}' because {$assignedCount} staff member(s) are currently assigned to it.",
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' deleted successfully",
        ]);
    }

    /**
     * List all staff user accounts
     */
    public function staffUsers()
    {
        $users = User::with(['branch', 'roleDefinition'])
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'pin_code' => $u->pin_code,
                    'role' => $u->role,
                    'role_name' => $u->roleDefinition?->name ?? $u->role,
                    'branch_id' => $u->branch_id,
                    'branch_name' => $u->branch?->branch_name ?? 'OmniPOS Main Store',
                    'is_active' => (bool)$u->is_active,
                    'created_at' => $u->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'staff' => $users,
        ]);
    }

    /**
     * Create a new staff account (Admin/Boss only)
     */
    public function storeStaffUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'pin_code' => 'required|string|min:4|max:8',
            'role' => 'required|string',
            'branch_id' => 'nullable|string|exists:branches,id',
        ]);

        if (empty($validated['branch_id'])) {
            $defaultBranch = Branch::first();
            $validated['branch_id'] = $defaultBranch ? $defaultBranch->id : 'store_main';
        }

        $username = strtolower(trim($validated['username']));
        $user = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $request->input('email', $username . '@omnipos.local'),
            'pin_code' => $validated['pin_code'],
            'role' => strtoupper(trim($validated['role'])),
            'branch_id' => $validated['branch_id'],
            'is_active' => true,
            'password' => Hash::make($validated['pin_code']),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Staff member '{$user->name}' created successfully",
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'pin_code' => $user->pin_code,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'is_active' => $user->is_active,
            ],
        ], 201);
    }

    /**
     * Update an existing staff account
     */
    public function updateStaffUser(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'username' => "sometimes|required|string|max:50|unique:users,username,{$id}",
            'pin_code' => 'sometimes|required|string|min:4|max:8',
            'role' => 'sometimes|required|string',
            'branch_id' => 'nullable|string|exists:branches,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['pin_code'])) {
            $validated['password'] = Hash::make($validated['pin_code']);
        }

        if (isset($validated['username'])) {
            $validated['username'] = strtolower(trim($validated['username']));
        }

        if (isset($validated['role'])) {
            $validated['role'] = strtoupper(trim($validated['role']));
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Staff member '{$user->name}' updated successfully",
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'pin_code' => $user->pin_code,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Delete or toggle active status of staff account
     */
    public function destroyStaffUser(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete or deactivate your own account.',
            ], 422);
        }

        // Soft deactivation or hard delete
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "Staff account '{$user->name}' deleted successfully",
        ]);
    }
}
