<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: drop existing indexes and columns
        Schema::table('teams', function (Blueprint $table) {
            $table->dropUnique('teams_name_unique');
            $table->dropUnique('teams_code_unique');
            $table->dropColumn('code');
        });

        // Step 2: add game_id FK and per-game unique constraint on name
        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('game_id')->after('id')->constrained()->cascadeOnDelete();
            $table->unique(['game_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropUnique(['game_id', 'name']);
            $table->dropForeign(['game_id']);
            $table->dropColumn('game_id');
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->string('code')->unique()->nullable();
            $table->unique(['name']);
        });
    }
};
