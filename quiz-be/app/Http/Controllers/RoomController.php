<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Game;
use App\Services\RoomService;
use App\Traits\ApiResponseTrait;

class RoomController extends Controller
{
    use ApiResponseTrait;

    private const ROOM_PER_PAGE = 10;

    public function __construct(
        private readonly RoomService $roomService
    ) {}

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
    public function store(CreateRoomRequest $request)
    {
        $result = $this->roomService->create($request->validated());

        return $this->successResponse($result, 'Room created successfully');
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
    public function update(UpdateRoomRequest $request, $id)
    {
        return $this->successResponse(
            $this->roomService->update(
                $id,
                $request->validated()
            ),
            'Room updated successfully'
        );
    }

    /**
     * Delete a room
     */
    public function destroy($id)
    {
        return $this->successResponse(
            $this->roomService->delete($id),
            'Room deleted successfully'
        );
    }

    /**
     * Get room details by access code
     */
    public function getByCode($code)
    {
        $game = Game::where('access_code', strtoupper($code))->first();

        if (!$game) {
            return $this->resourceNotFoundResponse('Phòng không tồn tại');
        }

        return $this->successResponse($game, 'Room found');
    }
}