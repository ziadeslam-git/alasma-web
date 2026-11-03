import sanitizeHtml from 'sanitize-html';

// SERVER-SIDE USE ONLY (CmsHtml is a Server Component): never import this file from a 'use client' file, or
// sanitize-html and its parser would ship in the browser bundle.
//
// Second layer of defence. The backend (Ganss.Xss) already sanitizes the body when the admin saves it, but this
// frontend never trusts that: it sanitizes again with an allowlist at least as strict as the backend's.

// Why a limit: sanitizing is linear but a multi-megabyte body would still hold a server render for a long time,
// and a real page is a few kilobytes. Over the limit we show nothing instead of risking a slow or truncated page.
export const MAX_CMS_HTML_LENGTH = 200_000;

export const CMS_ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'blockquote',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const;

const ALLOWED_DIR = new Set(['ltr', 'rtl', 'auto']);
const LANG_PATTERN = /^[A-Za-z-]{2,10}$/;
const SPAN_PATTERN = /^\d{1,3}$/;
// Control characters and spaces that browsers ignore inside a URL ("java\tscript:").
const URL_NOISE = /[\u0000-\u0020\u007f-\u009f]/g;
const SAFE_ABSOLUTE_URL = /^(?:https?:|mailto:|tel:)/i;
// A single leading slash is a site-relative path; "//" and "/\" are protocol-relative for a browser.
const SAFE_RELATIVE_URL = /^\/(?![/\\])/;

type Attributes = Record<string, string>;

function isSafeHref(value: string): boolean {
  const compact = value.replace(URL_NOISE, '');
  return SAFE_ABSOLUTE_URL.test(compact) || SAFE_RELATIVE_URL.test(compact);
}

// Keeps only valid dir and lang values; every other attribute is left for the allowlist below to filter.
function cleanCommon(attribs: Attributes): Attributes {
  const next = { ...attribs };
  const dir = next.dir?.trim().toLowerCase();
  if (dir === undefined || !ALLOWED_DIR.has(dir)) delete next.dir;
  else next.dir = dir;
  const lang = next.lang?.trim();
  if (lang === undefined || !LANG_PATTERN.test(lang)) delete next.lang;
  else next.lang = lang;
  return next;
}

function cleanCell(attribs: Attributes): Attributes {
  const next = cleanCommon(attribs);
  for (const key of ['colspan', 'rowspan']) {
    const value = next[key]?.trim();
    if (value === undefined || !SPAN_PATTERN.test(value)) delete next[key];
  }
  return next;
}

function cleanAnchor(attribs: Attributes): Attributes {
  const next = cleanCommon(attribs);
  if (next.href === undefined || !isSafeHref(next.href)) delete next.href;
  else next.href = next.href.trim();
  // target is not in the allowlist, so it is dropped; rel is always forced.
  next.rel = 'noopener noreferrer nofollow';
  return next;
}

const transformTags: NonNullable<sanitizeHtml.IOptions['transformTags']> = {};
for (const tag of CMS_ALLOWED_TAGS) {
  if (tag === 'a') {
    transformTags[tag] = (tagName, attribs) => ({ tagName, attribs: cleanAnchor(attribs) });
  } else if (tag === 'th' || tag === 'td') {
    transformTags[tag] = (tagName, attribs) => ({ tagName, attribs: cleanCell(attribs) });
  } else if (tag === 'h1') {
    // The page already has its own h1 (the API title): exactly one h1 per page.
    transformTags[tag] = (_tagName, attribs) => ({ tagName: 'h2', attribs: cleanCommon(attribs) });
  } else {
    transformTags[tag] = (tagName, attribs) => ({ tagName, attribs: cleanCommon(attribs) });
  }
}

const commonAttributes = ['dir', 'lang'];

const options: sanitizeHtml.IOptions = {
  allowedTags: [...CMS_ALLOWED_TAGS],
  allowedAttributes: {
    ...Object.fromEntries(CMS_ALLOWED_TAGS.map((tag) => [tag, commonAttributes])),
    a: ['href', 'title', 'rel', ...commonAttributes],
    th: ['colspan', 'rowspan', ...commonAttributes],
    td: ['colspan', 'rowspan', ...commonAttributes],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowProtocolRelative: false,
  // script, style, textarea and option lose their text too (the library default); other discarded tags keep text.
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
  transformTags,
  disallowedTagsMode: 'discard',
};

export function sanitizeCmsHtml(html: string): string {
  if (html.length > MAX_CMS_HTML_LENGTH) return '';
  return sanitizeHtml(html, options).trim();
}
