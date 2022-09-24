// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { v4 as uuid } from 'uuid';

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: 'AIzaSyANhJWh9MiXTVGOh33QxmuCyj3fPPjgnXk',
    authDomain: 'hd-bulldozer.firebaseapp.com',
    projectId: 'hd-bulldozer',
    storageBucket: 'hd-bulldozer.appspot.com',
    messagingSenderId: '177046212556',
    appId: '1:177046212556:web:d789d545a55e2562f95769',
    measurementId: 'G-FKXKLP8BDP',
  },
  useEmulators: true,
  clientId: uuid(),
  userId: 'p7xARjRPxv8cvbBOR59C',
  installableAppsWorkspace: '43d5f561-ef28-4236-a69d-d4c7d8ae76dd',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
