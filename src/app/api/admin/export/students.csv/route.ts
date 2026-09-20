import { NextResponse } from 'next/server';
import { getActor } from '@/server/auth/session';
import { canReadStudentPII } from '@/server/access/staff';
import { prisma } from '@/server/db';
import { HttpError } from '@/server/access/errors';
import { errorResponse } from '@/server/http';

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Экспорт студентов потока в CSV (ADMIN). docs/04 A9. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return errorResponse(new HttpError('UNAUTHENTICATED'));
  if (!canReadStudentPII(actor.role)) return errorResponse(new HttpError('PLAN_REQUIRED'));

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      enrollments: { where: { status: 'ACTIVE' }, take: 1, select: { planCode: true } },
      leaderboard: true,
    },
  });

  const header = ['name', 'email', 'plan', 'points', 'viewed', 'submitted', 'implemented', 'result', 'money_rub', 'registered'];
  const rows = students.map((s) => {
    const lb = s.leaderboard;
    return [
      s.name,
      s.email,
      s.enrollments[0]?.planCode ?? '',
      lb?.points ?? 0,
      lb?.viewedCount ?? 0,
      lb?.submittedCount ?? 0,
      lb?.implementedCount ?? 0,
      lb?.resultCount ?? 0,
      Math.round(Number(lb?.moneyTotalKopeks ?? 0) / 100),
      s.createdAt.toISOString().slice(0, 10),
    ]
      .map(csvCell)
      .join(',');
  });

  const csv = '﻿' + [header.join(','), ...rows].join('\n'); // BOM для Excel
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students.csv"',
    },
  });
}
