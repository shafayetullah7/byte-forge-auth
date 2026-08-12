import type { PlantAiPromptContext } from './build-plant-ai-context.query';
import type { PlantAiDraftRequest } from './plant-ai-draft.schema';
import { isPhotoOnlyPlantAiRequest } from './plant-ai-request.util';

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
11. Do not invent prices, SKUs, stock quantities, or variant images.
12. When only a photo is provided, identify the plant from the image first, then fill all fields. If uncertain, choose the closest match and keep descriptions cautious.
13. Include defaultVariant for the seller's first listing variant: growthStage, plantForm, bilingual title (en + bn), and when relevant propagationType and containerType for Bangladesh nursery listings (e.g. nursery pot, cutting). Titles should describe what is being sold (size/stage/form), not repeat the plant name alone.`;

export function buildPlantAiUserPrompt(
  request: PlantAiDraftRequest,
  context: PlantAiPromptContext,
): string {
  const photoOnly = isPhotoOnlyPlantAiRequest(request);
  const sellerSignals: string[] = [];

  if (photoOnly) {
    sellerSignals.push(
      'Photo-only input: no plant name was provided. Identify the plant from the attached image.',
      'Use visible leaf shape, color, variegation, growth habit, and pot context.',
      'If identification is uncertain, prefer generic but accurate care guidance and note uncertainty in descriptions.',
    );
  }

  if (request.plantName?.trim()) {
    sellerSignals.push(`Common name: ${request.plantName.trim()}`);
  }
  if (request.scientificName?.trim()) {
    sellerSignals.push(`Scientific name: ${request.scientificName.trim()}`);
  }
  if (request.thumbnailMediaId && !photoOnly) {
    sellerSignals.push(
      'A plant photo is attached. Use visual cues to refine descriptions.',
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
    '## Default variant (defaultVariant)',
    'Suggest attributes for the first sellable variant. Use visible cues from the photo when available.',
    'Typical BD nursery defaults: JUVENILE or MATURE growthStage, NURSERY_POT containerType, CUTTING propagation when applicable.',
    'Variant titles should be short product labels (e.g. "Juvenile in 6\\" nursery pot" / Bengali equivalent).',
    '',
    'Generate the complete plant listing draft JSON now.',
  ].join('\n');
}
