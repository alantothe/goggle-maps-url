import { neighborhoods as bogotaNeighborhoods } from './bogota/neighborhoods';
import { neighborhoods as medellinNeighborhoods } from './medellin/neighborhoods';

export const colombia = {
  code: 'colombia',
  label: 'Colombia',
  cities: [
    {
      label: 'Bogotá',
      value: 'bogota',
      neighborhoods: bogotaNeighborhoods,
    },
    {
      label: 'Medellín',
      value: 'medellin',
      neighborhoods: medellinNeighborhoods,
    },
  ],
};
