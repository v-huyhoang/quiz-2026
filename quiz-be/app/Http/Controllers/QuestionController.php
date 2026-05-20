<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateQuestionRequest;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $questions = Question::with('answers')->orderBy('created_at', 'desc')->get();
        
        $formattedQuestions = $questions->map(function ($q) {
            return [
                'id' => (string) $q->id,
                'text' => $q->content,
                'totalTime' => $q->time_limit_seconds,
                'options' => $q->answers->map(function ($a) {
                    return [
                        'id' => (string) $a->id,
                        'text' => $a->content,
                        'isCorrect' => (bool) $a->is_correct,
                    ];
                }),
            ];
        });

        return response()->json($formattedQuestions);
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
            DB::beginTransaction();

            $validated = $request->validated();

            $question = Question::create([
                'content' => $validated['text'],
                'time_limit_seconds' => $validated['totalTime'],
                'type' => 'single_choice', // UI only supports single choice (radio buttons) for now
            ]);

            foreach ($validated['options'] as $option) {
                $question->answers()->create([
                    'content' => $option['text'],
                    'is_correct' => $option['isCorrect'],
                ]);
            }

            DB::commit();

            $question->load('answers');

            $formattedQuestion = [
                'id' => (string) $question->id,
                'text' => $question->content,
                'totalTime' => $question->time_limit_seconds,
                'options' => $question->answers->map(function ($a) {
                    return [
                        'id' => (string) $a->id,
                        'text' => $a->content,
                        'isCorrect' => (bool) $a->is_correct,
                    ];
                }),
            ];

            return response()->json($formattedQuestion, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create question: ' . $e->getMessage()], 500);
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
            $question = Question::findOrFail($id);
            $question->delete(); // Cascades answers because of the DB foreign key constraint
            
            return response()->json(['message' => 'Deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete question'], 500);
        }
    }
}
