<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Build a success JSON response.
     *
     * @param  mixed  $data  The response payload (default: null).
     * @param  string  $message  Success message.
     * @param  int  $status  HTTP status code (default: 200).
     * @param  int  $code  Application-specific code (default: 0).
     * @return JsonResponse
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200,
        int $code = 0
    ): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Build an error JSON response.
     *
     * @param  string  $message  Error message .
     * @param  int  $status  HTTP status code (default: 500).
     * @param  mixed|null  $data  Optional additional data (default: null).
     * @param  int  $code  Application-specific code (default: 1).
     * @return JsonResponse
     */
    protected function errorResponse(
        string $message = 'Error',
        mixed $data = null,
        int $status = 500,
        int $code = 1
    ): JsonResponse
    {

        return response()->json([
            'success' => false,
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Build an error JSON response.
     *
     * @param  string  $message  Error message .
     * @param  int  $status  HTTP status code (default: 500).
     * @param  mixed|null  $data  Optional additional data (default: null).
     * @param  int  $code  Application-specific code (default: 1).
     * @return JsonResponse
     */
    protected function unprocessableEntityResponse(string $message = 'Error', mixed $data = null, int $code = 1): JsonResponse
    {

        return response()->json([
            'success' => false,
            'code' => $code,
            'message' => $message,
            'errors' => $data,
        ], 422);
    }

    /**
     * Build an error JSON response (404)
     *
     * @param  string  $message
     * @param  int  $code
     * @return JsonResponse
     */
    protected function resourceNotFoundResponse(string $message = 'Error', int $code = 1): JsonResponse
    {
        return response()->json([
            'success' => false,
            'code' => $code,
            'message' => $message,
        ], 404);
    }
}
