<?php

namespace App\Http\Controllers;

use App\Services\RoomService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ApiResponseTrait;
    
    private const ROOM_PER_PAGE = 10;
    
    public function __construct(
        private readonly RoomService $roomService
    ) {
    }

    /**
     * Get all rooms (games)
     */
    public function index()
    {
        return $this->successResponse(
            $this->roomService->paginate(self::ROOM_PER_PAGE),
            'Rooms retrieved successfully'
        );
    }

    /**
     * Create a new room (game)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'rounds' => 'required|integer|min:1|max:10',
            'questions_per_round' => 'required|integer|min:1|max:20',
            'access_code' => 'required|string|max:10|unique:games,access_code',
            'question_mode' => 'required|in:random,manual',
            'round_questions' => 'array',
            'round_questions.*.round_number' => 'required|integer',
            'round_questions.*.question_ids' => 'required|array',
        ]);

        $result = $this->roomService->create($request->all());
        return response()->json($result, 201);
    }

    /**
     * Get a specific room
     */
    public function show($id)
    {
        return response()->json($this->roomService->findById($id));
    }

    /**
     * Update a room
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'round_questions' => 'sometimes|array',
            'round_questions.*.round_number' => 'required_with:round_questions|integer',
            'round_questions.*.question_ids' => 'required_with:round_questions|array',
            'round_questions.*.question_ids.*' => 'required_with:round_questions|exists:questions,id',
        ]);

        return response()->json(
            $this->roomService->update($id, $request->only(['name', 'round_questions']))
        );
    }

    /**
     * Delete a room
     */
    public function destroy($id)
    {
        return response()->json($this->roomService->delete($id));
    }
}
