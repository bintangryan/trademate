// file: frontend/src/app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { path } = await request.json();

  // Ambil token rahasia dari header
  const secret = request.headers.get('x-revalidate-secret');

  // Validasi token
  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ message: 'Path is required' }, { status: 400 });
  }

  // Buang cache untuk path yang diminta (misalnya, '/')
  revalidatePath(path);

  return NextResponse.json({ revalidated: true, now: Date.now() });
}