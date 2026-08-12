import { resolveTranslation } from '@/libs/utils/resolve-translation.util';
import type { DistrictResponse, DivisionResponse } from './location.types';

type DistrictRow = {
  id: string;
  code: string;
  translations: Array<{ locale: string; name: string }>;
};

type DivisionRow = {
  id: string;
  code: string;
  translations: Array<{ locale: string; name: string }>;
  districts: DistrictRow[];
};

export function mapDistrict(
  district: DistrictRow,
  lang: string,
): DistrictResponse {
  const districtTranslation = resolveTranslation(district.translations, lang);

  return {
    id: district.id,
    code: district.code,
    name: districtTranslation?.name ?? 'Unnamed District',
  };
}

export function mapDivision(
  division: DivisionRow,
  lang: string,
): DivisionResponse {
  const divisionTranslation = resolveTranslation(division.translations, lang);

  return {
    id: division.id,
    code: division.code,
    name: divisionTranslation?.name ?? 'Unnamed Division',
    districts: division.districts.map((district) =>
      mapDistrict(district, lang),
    ),
  };
}
