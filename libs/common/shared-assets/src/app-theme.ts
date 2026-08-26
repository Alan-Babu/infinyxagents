import { definePreset } from '@primeuix/themes';
// @ts-ignore
import Aura from '@primeuix/themes/aura';

export const AppTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#F2FBFE',
            100: '#D5F2FC',
            200: '#9BE0F7',
            300: '#60CEF3',
            400: '#26BDEF',
            500: '#0F99C7',
            600: '#0C7FA6',
            700: '#0A6685',
            800: '#074C63',
            900: '#053342',
            950: '#042632',
        },
    },
});

/** UAE Ministry of Foreign Affairs brand palette — gold, matching brand-primary-tokens.mofa.css. */
export const MofaTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#F9F7ED',
            100: '#F2ECCF',
            200: '#E6D7A2',
            300: '#D7BC6D',
            400: '#CBA344',
            500: '#B68A35',
            600: '#92722A',
            700: '#7C5E24',
            800: '#6C4527',
            900: '#5D3B26',
            950: '#361E12',
        },
    },
});
