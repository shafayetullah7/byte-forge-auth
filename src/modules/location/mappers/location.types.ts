export type DistrictResponse = {
  id: string;
  code: string;
  name: string;
};

export type DivisionResponse = {
  id: string;
  code: string;
  name: string;
  districts: DistrictResponse[];
};
