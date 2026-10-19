import { describe, expect, it } from 'vitest';
import {
  isSealedSettingSecret,
  openSettingSecret,
  sealSettingSecret,
} from '@/server/settings/crypto';

describe('шифрование секретных настроек', () => {
  const master = 'test-master-secret-with-enough-entropy';

  it('не сохраняет исходный секрет и расшифровывает его обратно', () => {
    const source = 'live_secret-value';
    const sealed = sealSettingSecret(source, master);
    expect(isSealedSettingSecret(sealed)).toBe(true);
    expect(sealed).not.toContain(source);
    expect(openSettingSecret(sealed, master)).toBe(source);
  });

  it('поддерживает старые незашифрованные значения', () => {
    expect(openSettingSecret('legacy-secret', master)).toBe('legacy-secret');
  });

  it('не расшифровывает значение другим мастер-ключом', () => {
    const sealed = sealSettingSecret('secret', master);
    expect(() => openSettingSecret(sealed, 'another-master')).toThrow();
  });
});
