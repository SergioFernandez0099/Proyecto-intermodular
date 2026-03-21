<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Genre;
use App\Http\Resources\GenreResource;

class GenreController extends Controller {
    public function index() {
        $genres = Genre::all();
        return GenreResource::collection($genres);
    }

    public function show($id) {
        $genre = Genre::findOrFail($id);
        if (!$genre) {
            return response()->json(['error' => 'Genre not found'], 404);
        }
        return new GenreResource($genre);
    }

    public function store(Request $request) {
        $genre = Genre::create($request->all());
        return response()->json($genre, 201);
    }

    public function update(Request $request, $id) {
        $genre = Genre::find($id);
        if (!$genre) {
            return response()->json(['error' => 'Genre not found'], 404);
        }
        $genre->update($request->all());
        return response()->json($genre, 200);
    }

    public function destroy($id) {
        Genre::destroy($id);
        return response()->json(null, 204);
    }
}
