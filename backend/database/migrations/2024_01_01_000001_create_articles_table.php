<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title')->default('Untitled');
            $table->string('status')->default('pending');
            $table->jsonb('raw_content_json')->nullable();
            $table->jsonb('extracted_data_json')->nullable();
            $table->string('document_path')->nullable();
            $table->jsonb('image_paths')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
