import type { PlantAiPromptContext } from './build-plant-ai-context.query';
import type { PlantAiDraftRequest } from './plant-ai-draft.schema';

export const PLANT_AI_SYSTEM_INSTRUCTION = `You are a horticulture assistant for Byte Forge, a plant marketplace in Bangladesh.

Your task is to produce a structured JSON plant listing draft for sellers. Follow these rules strictly:

1. Output must match the provided JSON schema exactly. No markdown, no commentary.
2. Write user-facing content in BOTH English (en) and Bengali (bn) for all bilingual fields.
3. Bengali should be natural for Bangladeshi plant buyers and sellers — not word-for-word translation.
4. Tailor care advice to Bangladesh: tropical climate, monsoon humidity, indoor apartments, and common nursery practices.
5. scientificName is Latin once (not duplicated in translation blocks).
6. categoryId must be exactly one id from the supplied categories list.
7. tagIds must only use ids from the supplied tags list (0–5 relevant tags).
8. Enum fields (lightRequirement, wateringFrequency, etc.) must use ONLY the allowed keys provided.
9. Be conservative on toxicityInfo — note if toxic to pets or humans when commonly known.
10. If the seller input is in Bengali, still fill both en and bn blocks.
11. Do not invent prices, SKUs, stock quantities, or variant images.`;

export function buildPlantAiUserPrompt(
  request: PlantAiDraftRequest,
  context: PlantAiPromptContext,
): string {
  const sellerSignals: string[] = [];
  if (request.plantName?.trim()) {
    sellerSignals.push(`Common name: ${request.plantName.trim()}`);
  }
  if (request.scientificName?.trim()) {
    sellerSignals.push(`Scientific name: ${request.scientificName.trim()}`);
  }
  if (request.thumbnailMediaId) {
    sellerSignals.push(
      'A plant photo is attached. Identify the plant if possible and use visual cues for descriptions.',
    );
  }
  if (request.localeHint) {
    sellerSignals.push(`Seller UI locale hint: ${request.localeHint}`);
  }

  return [
    '## Seller input',
    sellerSignals.length > 0 ? sellerSignals.join('\n') : 'No text name provided.',
    '',
    '## Allowed categories (pick exactly one categoryId)',
    JSON.stringify(context.categories, null, 2),
    '',
    '## Allowed tags (pick 0–5 tagIds)',
    JSON.stringify(context.tags, null, 2),
    '',
    '## Allowed enum values',
    JSON.stringify(context.enums, null, 2),
    '',
    'Generate the complete plant listing draft JSON now.',
  ].join('\n');
}
