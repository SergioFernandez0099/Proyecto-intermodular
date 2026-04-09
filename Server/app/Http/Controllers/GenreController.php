<?php

namespace App\Http\Controllers;

use App\Http\Resources\GenreResource;
use App\Models\Genre;
use Illuminate\Http\Request;

class GenreController extends Controller
{
    public function index()
    {
        return GenreResource::collection(Genre::all());
    }

    public function show(Genre $genre)
    {
        return new GenreResource($genre);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:genres',
        ]);

        $genre = Genre::create($data);

        return new GenreResource($genre);
    }

    public function update(Request $request, Genre $genre)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:genres,name,' . $genre->id,
        ]);

        $genre->update($data);

        return new GenreResource($genre);
    }

    public function destroy(Genre $genre)
    {
        $genre->delete();

        return response()->json(null, 204);
    }
}
