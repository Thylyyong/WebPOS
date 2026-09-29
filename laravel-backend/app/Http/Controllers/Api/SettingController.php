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
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        if (!empty($settings['qr_code_image'])) {
            $qr = $settings['qr_code_image'];
            if (!str_starts_with($qr, 'http://') && !str_starts_with($qr, 'https://') && !str_starts_with($qr, 'data:')) {
                $settings['qr_code_url'] = url(ltrim($qr, '/'));
            } else {
                $settings['qr_code_url'] = $qr;
            }
        }

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

        $settings = Setting::all()->pluck('value', 'key')->toArray();
        if (!empty($settings['qr_code_image'])) {
            $qr = $settings['qr_code_image'];
            if (!str_starts_with($qr, 'http://') && !str_starts_with($qr, 'https://') && !str_starts_with($qr, 'data:')) {
                $settings['qr_code_url'] = url(ltrim($qr, '/'));
            } else {
                $settings['qr_code_url'] = $qr;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully',
            'settings' => $settings,
        ]);
    }

    /**
     * Upload store payment QR code image
     */
    public function uploadQr(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        $uploadDir = public_path('uploads/qr');
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $file = $request->file('image');
        $filename = 'qr_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move($uploadDir, $filename);

        $relativePath = 'uploads/qr/' . $filename;
        Setting::setVal('qr_code_image', $relativePath);

        return response()->json([
            'success' => true,
            'message' => 'Payment QR code image uploaded successfully',
            'qr_code_image' => $relativePath,
            'qr_code_url' => url($relativePath),
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
