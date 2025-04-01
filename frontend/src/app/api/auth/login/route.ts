import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// This is a simple authentication endpoint
// In a real app, you would validate credentials against a database
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // In a real app, validate credentials against a database
    // This is just a simplified example
    if (username === 'admin' && password === 'password') {
      // Create JWT token
      const token = jwt.sign(
        { sub: '1', username, role: 'admin' },
        process.env.JWT_SECRET || '',
        { expiresIn: '1h' }
      );

      return NextResponse.json({ token });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}