import { createHash, randomBytes } from 'node:crypto';
import type { Actor } from '@/server/access';
import { prisma } from '@/server/db';

const MCP_TOKEN_KIND = 'MCP_ACCESS';
const MCP_TOKEN_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function getMcpTokenStatus(userId: string): Promise<{ active: boolean; expiresAt: Date | null }> {
  const token = await prisma.authToken.findFirst({
    where: {
      userId,
      kind: MCP_TOKEN_KIND,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: { expiresAt: true },
  });
  return { active: Boolean(token), expiresAt: token?.expiresAt ?? null };
}

export async function issueMcpToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = `sgl_mcp_${randomBytes(32).toString('base64url')}`;
  const expiresAt = new Date(Date.now() + MCP_TOKEN_LIFETIME_MS);

  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: { userId, kind: MCP_TOKEN_KIND, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.authToken.create({
      data: { userId, kind: MCP_TOKEN_KIND, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export async function revokeMcpTokens(userId: string): Promise<void> {
  await prisma.authToken.updateMany({
    where: { userId, kind: MCP_TOKEN_KIND, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const token = match?.[1]?.trim();
  return token?.startsWith('sgl_mcp_') ? token : null;
}

export async function getMcpActor(request: Request): Promise<Actor | null> {
  const token = readBearerToken(request);
  if (!token) return null;

  const row = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          blockedAt: true,
          deletedAt: true,
          enrollments: {
            where: {
              status: 'ACTIVE',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            take: 1,
            select: { planCode: true },
          },
        },
      },
    },
  });

  if (
    !row ||
    row.kind !== MCP_TOKEN_KIND ||
    row.usedAt ||
    row.expiresAt <= new Date() ||
    row.user.blockedAt ||
    row.user.deletedAt
  ) {
    return null;
  }

  const enrollment = row.user.enrollments[0];
  return {
    id: row.user.id,
    role: row.user.role,
    plan: enrollment?.planCode ?? null,
    enrollmentActive: Boolean(enrollment),
  };
}
