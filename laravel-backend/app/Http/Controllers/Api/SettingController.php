<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Branch;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all store and hardware settings
     */
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * Batch update store settings
     */
    public function update(Request $request)
    {
        $payload = $request->input('settings', []);

        foreach ($payload as $key => $value) {
            Setting::setVal($key, (string) $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully',
            'settings' => Setting::all()->pluck('value', 'key'),
        ]);
    }

    /**
     * List branches
     */
    public function branches()
    {
        $branches = Branch::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'branches' => $branches,
        ]);
    }
}
