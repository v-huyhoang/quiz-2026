<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Make nullable to support non-choice question types (image_input, etc.)
            $table->unsignedBigInteger('answer_id')->nullable()->change();
            // Store player's raw answer in a type-agnostic format
            // single_choice: {"answer_id": 5}
            // image_input:   {"text": "dau do bim leo"}
            $table->json('submitted_data')->nullable()->after('answer_id');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn('submitted_data');
            $table->unsignedBigInteger('answer_id')->nullable(false)->change();
        });
    }
};
