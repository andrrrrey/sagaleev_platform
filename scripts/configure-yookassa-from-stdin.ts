import { stdin } from 'node:process';
import { checkYookassaAccount } from '../src/server/payments/yookassa';
import { saveSettings } from '../src/server/settings/store';
import { prisma } from '../src/server/db';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const input = JSON.parse(await readStdin()) as { shopId?: unknown; secretKey?: unknown };
  if (typeof input.shopId !== 'string' || !/^\d+$/.test(input.shopId.trim())) {
    throw new Error('Shop ID должен состоять из цифр.');
  }
  if (typeof input.secretKey !== 'string' || input.secretKey.trim().length < 20) {
    throw new Error('Secret Key отсутствует или имеет неверный формат.');
  }

  await saveSettings(
    {
      YOOKASSA_SHOP_ID: input.shopId.trim(),
      YOOKASSA_SECRET_KEY: input.secretKey.trim(),
    },
    'system:yookassa-import',
  );
  const status = await checkYookassaAccount();
  console.log(
    JSON.stringify({
      configured: true,
      enabled: status.enabled,
      test: status.test,
      paymentMethods: status.paymentMethods,
      fiscalizationEnabled: status.fiscalizationEnabled,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Не удалось настроить ЮKassa.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
