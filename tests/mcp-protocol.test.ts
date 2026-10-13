import { describe, expect, it } from 'vitest';
import type { Actor } from '@/server/access';
import { readBearerToken } from '@/server/mcp/auth';
import { handleMcpMessage, MCP_PROTOCOL_VERSION } from '@/server/mcp/protocol';

const actor: Actor = { id: 'user-1', role: 'STUDENT', plan: 'SELF', enrollmentActive: true };
const editor: Actor = { id: 'editor-1', role: 'EDITOR', plan: null, enrollmentActive: false };
const admin: Actor = { id: 'admin-1', role: 'ADMIN', plan: null, enrollmentActive: false };

describe('MCP transport helpers', () => {
  it('accepts only platform bearer tokens', () => {
    expect(
      readBearerToken(
        new Request('https://example.test', {
          headers: { Authorization: 'Bearer sgl_mcp_secret' },
        }),
      ),
    ).toBe('sgl_mcp_secret');
    expect(
      readBearerToken(
        new Request('https://example.test', {
          headers: { Authorization: 'Basic abc' },
        }),
      ),
    ).toBeNull();
    expect(
      readBearerToken(
        new Request('https://example.test', {
          headers: { Authorization: 'Bearer other_secret' },
        }),
      ),
    ).toBeNull();
  });

  it('initializes with tools capability and safety instructions', async () => {
    const result = await handleMcpMessage(actor, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: MCP_PROTOCOL_VERSION },
    });
    expect(result?.result).toMatchObject({
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'sagaleev-platform' },
    });
    expect(JSON.stringify(result?.result)).toContain('Не проси пароли');
  });

  it('lists route and skill tools with write annotations', async () => {
    const result = await handleMcpMessage(actor, {
      jsonrpc: '2.0',
      id: 'tools',
      method: 'tools/list',
    });
    const payload = result?.result as {
      tools: Array<{ name: string; annotations: { readOnlyHint: boolean } }>;
    };
    expect(payload.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        'get_route_overview',
        'get_current_step',
        'save_step_result',
        'list_skills',
        'get_skill',
      ]),
    );
    expect(
      payload.tools.find((tool) => tool.name === 'save_step_result')?.annotations.readOnlyHint,
    ).toBe(false);
    expect(payload.tools.map((tool) => tool.name)).not.toContain('create_content_draft');
    expect(payload.tools.map((tool) => tool.name)).not.toContain('publish_draft');
  });

  it('adds draft tools for editors but keeps publication admin-only', async () => {
    const editorResult = await handleMcpMessage(editor, {
      jsonrpc: '2.0',
      id: 'editor-tools',
      method: 'tools/list',
    });
    const editorTools = (editorResult?.result as { tools: Array<{ name: string }> }).tools.map(
      (tool) => tool.name,
    );
    expect(editorTools).toEqual(
      expect.arrayContaining([
        'list_course_structure',
        'list_drafts',
        'create_content_draft',
        'update_content_draft',
        'create_skill_draft',
        'validate_draft',
        'preview_draft',
      ]),
    );
    expect(editorTools).not.toContain('publish_draft');

    const adminResult = await handleMcpMessage(admin, {
      jsonrpc: '2.0',
      id: 'admin-tools',
      method: 'tools/list',
    });
    const adminTools = (adminResult?.result as { tools: Array<{ name: string }> }).tools.map(
      (tool) => tool.name,
    );
    expect(adminTools).toContain('publish_draft');
  });

  it('rejects publishing through MCP for an editor even if called directly', async () => {
    const result = await handleMcpMessage(editor, {
      jsonrpc: '2.0',
      id: 'publish',
      method: 'tools/call',
      params: { name: 'publish_draft', arguments: { kind: 'content', id: 'draft-1' } },
    });
    expect(JSON.stringify(result?.result)).toContain('только администратору');
  });

  it('ignores initialized notification', async () => {
    await expect(
      handleMcpMessage(actor, {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }),
    ).resolves.toBeNull();
  });
});
