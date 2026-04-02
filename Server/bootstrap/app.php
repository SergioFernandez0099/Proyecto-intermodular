<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Esto le dice a Laravel que NUNCA redirija, siempre JSON
        $middleware->redirectGuestsTo(function () {
            throw new AuthenticationException();
        });

        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);


        // CORS / Sanctum
        $middleware->statefulApi();

        // CSRF
        $middleware->validateCsrfTokens(except: [
            'login',
            'api/*',
        ]);

        // Proxies
        $middleware->trustProxies(at: '*');

        // ← Middleware de verificación de role
        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return response()->json([
                'message' => 'No tienes permiso para realizar esta acción.',
            ], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            return response()->json([
                'message' => 'Recurso no encontrado.',
            ], 404);
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            return response()->json([
                'message' => 'Datos inválidos.',
                'errors' => $e->errors(),
            ], 422);
        });

        // Resto de errores HTTP (abort(404), abort(500), etc.)
        $exceptions->render(function (HttpException $e, Request $request) {
            return response()->json([
                'message' => match ($e->getStatusCode()) {
                    404 => 'Recurso no encontrado.',
                    405 => 'Método no permitido.',
                    429 => 'Demasiadas peticiones.',
                    500 => 'Error interno del servidor.',
                    default => 'Error del servidor.',
                }
            ], $e->getStatusCode());
        });

    })->create();
