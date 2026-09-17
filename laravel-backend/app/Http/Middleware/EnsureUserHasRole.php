<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        foreach ($roles as $role) {
            $method = 'is' . str_replace('_', '', ucwords($role, '_'));
            if (method_exists($user, $method) && $user->$method()) {
                return $next($request);
            }
        }

        abort(403, 'You do not have permission to perform this action.');
    }
}