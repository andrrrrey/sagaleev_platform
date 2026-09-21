import { NextResponse } from 'next/server';
import { getMcpActor } from '@/server/mcp/auth';
import { handleMcpPayload, MCP_PROTOCOL_VERSION } from '@/server/mcp/protocol';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const mcpHeaders = { 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION };

export async function POST(request: Request) {
  const actor = await getMcpActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Создай или обнови MCP-токен в профиле платформы.' },
      { status: 401, headers: { ...mcpHeaders, 'WWW-Authenticate': 'Bearer realm="sagaleev-platform"' } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: mcpHeaders },
    );
  }

  const result = await handleMcpPayload(actor, payload);
  if (result === null) return new NextResponse(null, { status: 202, headers: mcpHeaders });
  return NextResponse.json(result, { headers: mcpHeaders });
}

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: mcpHeaders });
}

export async function DELETE() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: mcpHeaders });
}
