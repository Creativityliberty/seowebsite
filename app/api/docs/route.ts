import { NextResponse } from 'next/server';
import { spec } from '../docs-config';

export async function GET() {
  return NextResponse.json(spec);
}
