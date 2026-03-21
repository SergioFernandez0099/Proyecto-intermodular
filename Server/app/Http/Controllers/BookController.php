<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Book;
use App\Http\Resources\BookResource;

class BookController extends Controller {
    public function index() {
        //$books = Book::all();

        $books = Book::with('genre')->get();
        return BookResource::collection($books);
    }

    public function show($id) {
        $book = Book::with('genre')->findOrFail($id);
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }
        return new BookResource($book);
    }

    public function store(Request $request) {
        $book = Book::create($request->all());
        return response()->json($book, 201);
    }

    public function update(Request $request, $id) {
        $book = Book::find($id);
        if (!$book) {
            return response()->json(['error' => 'Book not found'], 404);
        }
        $book->update($request->all());
        return response()->json($book, 200);
    }

    public function destroy($id) {
        Book::destroy($id);
        return response()->json(null, 204);
    }
}
