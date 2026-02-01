import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: '0711 Vault',
    executableName: '0711-vault',
    appBundleId: 'io.0711.vault',
    appCategoryType: 'public.app-category.photography',
    // icon: 'assets/icon',  // Add when icon available
    // macOS specific
    darwinDarkModeSupport: true,
    // Code signing - uncomment when certificates are available
    // osxSign: {
    //   identity: 'Developer ID Application',
    // },
    // osxNotarize: {
    //   appleId: process.env.APPLE_ID || '',
    //   appleIdPassword: process.env.APPLE_ID_PASSWORD || '',
    //   teamId: process.env.APPLE_TEAM_ID || '',
    // },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: '0711Vault',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      name: '0711-Vault',
      // icon: 'assets/icon.icns',  // Add when icon available
      // background: 'assets/dmg-background.png',  // Add when background available
      contents: [
        { x: 130, y: 220, type: 'file', path: '' }, // App
        { x: 410, y: 220, type: 'link', path: '/Applications' },
      ],
      window: {
        width: 540,
        height: 400,
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
