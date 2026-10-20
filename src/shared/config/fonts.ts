import localFont from 'next/font/local';

// The three families are self-hosted (src/assets/fonts, SIL OFL, see LICENSES.md): the build never calls Google.
// Each family is declared once per subset (arabic, latin) with the same font-family name and its own
// unicode-range, so the browser fetches only the file a page needs. The family names are exactly the ones
// tokens.css lists in --font-display, --font-sans and --font-reading, so those variables resolve to these files.
// next/font needs literal options, which is why the six calls are written out in full.
// The maximum weight is 700: there is no 800 file (see AGENTS.md).

export const arefRuqaaArabic = localFont({
  src: [
    { path: '../../assets/fonts/aref-ruqaa-400-arabic.woff2', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/aref-ruqaa-700-arabic.woff2', weight: '700', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Aref Ruqaa' },
    {
      prop: 'unicode-range',
      value:
        'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1',
    },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const arefRuqaaLatin = localFont({
  src: [
    { path: '../../assets/fonts/aref-ruqaa-400-latin.woff2', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/aref-ruqaa-700-latin.woff2', weight: '700', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Aref Ruqaa' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const plexSansArabicArabic = localFont({
  src: [
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-300-arabic.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-400-arabic.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-500-arabic.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-600-arabic.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-700-arabic.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  declarations: [
    { prop: 'font-family', value: 'IBM Plex Sans Arabic' },
    {
      prop: 'unicode-range',
      value:
        'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1',
    },
  ],
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

export const plexSansArabicLatin = localFont({
  src: [
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-300-latin.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-400-latin.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-500-latin.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-600-latin.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/ibm-plex-sans-arabic-700-latin.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  declarations: [
    { prop: 'font-family', value: 'IBM Plex Sans Arabic' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

export const amiriArabic = localFont({
  src: [
    { path: '../../assets/fonts/amiri-400-arabic.woff2', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/amiri-700-arabic.woff2', weight: '700', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Amiri' },
    {
      prop: 'unicode-range',
      value:
        'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1',
    },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const amiriLatin = localFont({
  src: [
    { path: '../../assets/fonts/amiri-400-latin.woff2', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/amiri-700-latin.woff2', weight: '700', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Amiri' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
