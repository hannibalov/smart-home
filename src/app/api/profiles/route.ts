import { NextResponse } from 'next/server';
import { PROFILES } from '@/profiles';

export async function GET() {
    return NextResponse.json(PROFILES);
}
