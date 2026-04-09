<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuthorResource;
use App\Models\Author;
use Illuminate\Http\Request;

class AuthorController extends Controller
{
    public function index()
    {
        return AuthorResource::collection(Author::all());
    }

    public function show(Author $author)
    {
        return new AuthorResource($author);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:authors',
        ]);

        $author = Author::create($data);

        return new AuthorResource($author);
    }

    public function update(Request $request, Author $author)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:authors,name,' . $author->id,
        ]);

        $author->update($data);

        return new AuthorResource($author);
    }

    public function destroy(Author $author)
    {
        $author->delete();

        return response()->json(null, 204);
    }
}
