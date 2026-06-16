<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Change ENUM → VARCHAR so new question types can be added without ALTER ENUM migrations
        DB::statement("ALTER TABLE questions MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'single_choice'");

        Schema::table('questions', function (Blueprint $table) {
            $table->text('content')->nullable()->change();
            $table->string('image_path')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->text('content')->nullable(false)->change();
            $table->dropColumn('image_path');
        });

        DB::statement("ALTER TABLE questions MODIFY COLUMN type ENUM('single_choice','multiple_choice') NOT NULL DEFAULT 'single_choice'");
    }
};
