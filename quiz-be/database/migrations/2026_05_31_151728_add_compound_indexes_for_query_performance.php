<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Covers: WHERE game_id = ? AND status IN ('active', 'finished')
        // Used in buildState() on every admin action
        Schema::table('rounds', function (Blueprint $table) {
            $table->index(['game_id', 'status'], 'rounds_game_status');
        });

        // Covers: WHERE round_id = ? AND status = 'open/closed/pending'
        // Used in openNextQuestion, closeCurrentQuestion, buildState — most hot queries
        Schema::table('round_questions', function (Blueprint $table) {
            $table->index(['round_id', 'status'], 'rq_round_status');
        });

        // Covers: WHERE round_question_id = ? [AND is_correct = 1]
        // Used in getRoundResults aggregate and buildState admin view
        Schema::table('submissions', function (Blueprint $table) {
            $table->index(['round_question_id', 'is_correct'], 'sub_rq_correct');
        });
    }

    public function down(): void
    {
        Schema::table('rounds', function (Blueprint $table) {
            $table->dropIndex('rounds_game_status');
        });

        Schema::table('round_questions', function (Blueprint $table) {
            $table->dropIndex('rq_round_status');
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex('sub_rq_correct');
        });
    }
};
