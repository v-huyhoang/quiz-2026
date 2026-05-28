<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->string('access_code', 10)->unique()->after('name');
            $table->unsignedTinyInteger('rounds')->default(3)->after('access_code');
            $table->unsignedTinyInteger('questions_per_round')->default(10)->after('rounds');
            $table->enum('question_mode', ['random', 'manual'])->default('random')->after('questions_per_round');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropUnique(['access_code']);
            $table->dropColumn(['access_code', 'rounds', 'questions_per_round', 'question_mode']);
        });
    }
};
