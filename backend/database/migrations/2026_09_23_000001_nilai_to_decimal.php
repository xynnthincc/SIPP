<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nilai boleh desimal (mis. 85.5): kolom nilai langsung mapel & praktik/hafalan
 * diperlebar dari unsignedTinyInteger ke decimal(5,2) mengikuti nilais yang
 * memang sudah decimal. Masuk rentang 0–100 tetap divalidasi di controller.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nilai_mapels', function (Blueprint $table) {
            $table->decimal('nilai', 5, 2)->nullable()->change();
        });

        Schema::table('nilai_praktiks', function (Blueprint $table) {
            $table->decimal('nilai', 5, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('nilai_mapels', function (Blueprint $table) {
            $table->unsignedTinyInteger('nilai')->nullable()->change();
        });

        Schema::table('nilai_praktiks', function (Blueprint $table) {
            $table->unsignedTinyInteger('nilai')->nullable()->change();
        });
    }
};
