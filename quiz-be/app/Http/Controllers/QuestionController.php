<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateQuestionRequest;
use App\Http\Requests\ImportQuestionsRequest;
use App\Services\QuestionImportService;
use App\Services\QuestionService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    use ApiResponseTrait;

    private const QUESTIONS_PER_PAGE = 20;

    public function __construct(
        private readonly QuestionService $questionService,
        private readonly QuestionImportService $questionImportService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return $this->successResponse(
            $this->questionService->paginate(self::QUESTIONS_PER_PAGE),
            'Questions retrieved successfully'
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateQuestionRequest $request)
    {
        try {
            return $this->successResponse(
                $this->questionService->create($request->validated()),
                'Question created successfully',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create question: ' . $e->getMessage());
        }
    }

    public function import(ImportQuestionsRequest $request)
    {
        try {
            return $this->successResponse(
                $this->questionImportService->importFromFile($request->file('file')),
                'Questions imported successfully',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to import questions: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $this->questionService->delete($id);

            return $this->successResponse(null, 'Question deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete question');
        }
    }
}
