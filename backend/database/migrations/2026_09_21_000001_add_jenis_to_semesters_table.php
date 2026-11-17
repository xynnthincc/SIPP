<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->enum('jenis', ['Akhir', 'Sementara'])->default('Akhir')->after('nama')
                ->comment('Jenis wadah: Akhir = rapor semester penuh, Sementara = rapor tengah semester (nilai terpisah)');
        });
    }

    public function down(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->dropColumn('jenis');
        });
    }
};
