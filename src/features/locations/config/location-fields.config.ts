import { countryCodes } from "../../shared/utils/country-codes";

export const contactInformationFields = [
  {
    type: 'collapsible',
    label: 'Contact Information',
    admin: {
      initCollapsed: false,
    },
    fields: [
      {
        name: 'contactAddress',
        type: 'text',
        admin: {
          description: 'Google Maps URL or physical address for contact purposes',
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'countryCode',
            type: 'select',
            options: countryCodes.map(country => ({
              label: `${country.flag} ${country.name} (${country.dialCode})`,
              value: country.code,
            })),
            admin: {
              width: '30%',
              description: 'Country Code for phone number',
            },
          },
          {
            name: 'phoneNumber',
            type: 'text',
            admin: {
              description: 'Contact phone number (without country code)',
              width: '70%',
            },
          },
        ],
      },
      {
        name: 'website',
        type: 'text',
        admin: {
          description: 'Website URL (e.g., https://example.com)',
        },
      },
    ],
  },
];

// Helper function to get country code options formatted for UI
export function getCountryCodeOptions() {
  return countryCodes.map(country => ({
    label: `${country.flag} ${country.name} (${country.dialCode})`,
    value: country.code,
  }));
}

// Helper function to get country code by value
export function getCountryByCode(code: string) {
  return countryCodes.find(country => country.code === code);
}

// Helper function to format display value for country code field
export function formatCountryDisplay(code: string): string {
  const country = getCountryByCode(code);
  return country ? `${country.flag} ${country.name} (${country.dialCode})` : code;
}
