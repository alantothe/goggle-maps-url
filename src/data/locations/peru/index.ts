import { neighborhoods as limaNeighborhoods } from './lima/neighborhoods';
import { neighborhoods as cuscoNeighborhoods } from './cusco/neighborhoods';

export const peru = {
  code: 'peru',
  label: 'Peru',
  cities: [
    {
      label: 'Lima',
      value: 'lima',
      neighborhoods: limaNeighborhoods,
    },
    {
      label: 'Cusco',
      value: 'cusco',
      neighborhoods: cuscoNeighborhoods,
    },
  ],
};
