/**
 * Dev-only manual script. Requires DB + GEMINI_API_KEY + PLANT_AI_ENABLED=true.
 *
 * Usage:
 *   pnpm exec ts-node -r tsconfig-paths/register scripts/try-plant-ai-draft.ts "Monstera deliciosa"
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GeneratePlantAiDraftCommand } from '../src/modules/catalog/application/plant-ai';

async function main() {
  const scientificName = process.argv[2]?.trim();
  if (!scientificName) {
    console.error('Usage: try-plant-ai-draft.ts "<scientific name>"');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const command = app.get(GeneratePlantAiDraftCommand);
    const draft = await command.execute({ scientificName });
    console.log(JSON.stringify(draft, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
