import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db/prisma';

const ALLOWED_LIST_USERS = ['ADMIN', 'MANAGER'];

/**
 * Returns a minimal list of users for route-visualization user picker.
 * Allowed only for ADMIN and MANAGER.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_LIST_USERS.includes(currentUser.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}
