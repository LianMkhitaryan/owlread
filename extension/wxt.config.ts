import { defineConfig } from 'wxt';

export default defineConfig({
  // MV3 for every browser, Firefox included (architecture 3).
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Owlread',
    description: 'Makes every web page comfortable to read, whatever your eyes.',
    // Permissions are added step by step, only when a feature needs them (architecture 10).
    permissions: [],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // TODO: add a permanent `id` before the first Firefox Add-ons publish.
          // Owlread collects no data (architecture 2 and 10).
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
