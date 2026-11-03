import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '@/test/axe';

import { CmsHtml } from './components/cms-html';
import { MAX_CMS_HTML_LENGTH, sanitizeCmsHtml } from './sanitize-cms-html';

type Case = { name: string; input: string; absent: RegExp[]; present?: string[] };

const NO_SCRIPT = /<script|alert\(1\)/i;
const cases: Case[] = [
  {
    name: 'script tag',
    input: '<p>a</p><script>alert(1)</script>',
    absent: [NO_SCRIPT],
    present: ['<p>a</p>'],
  },
  { name: 'img onerror', input: '<img src=x onerror=alert(1)>', absent: [/<img/i, /onerror/i] },
  {
    name: 'javascript: href',
    input: '<a href="javascript:alert(1)">x</a>',
    absent: [/javascript:/i, /href/i],
    present: ['x'],
  },
  {
    name: 'mixed-case javascript:',
    input: '<a href="JaVaScRiPt:alert(1)">x</a>',
    absent: [/javascript:/i, /href/i],
  },
  {
    name: 'entity-encoded javascript:',
    input: '<a href="java&#115;cript:alert(1)">x</a>',
    absent: [/javascript:/i, /href/i, /&#115;/],
  },
  {
    name: 'tab inside javascript:',
    input: '<a href="java\tscript:alert(1)">x</a>',
    absent: [/script:/i, /href/i],
  },
  { name: 'data: href', input: '<a href="data:text/html,x">x</a>', absent: [/data:/i, /href/i] },
  { name: 'vbscript: href', input: '<a href="vbscript:x">x</a>', absent: [/vbscript/i, /href/i] },
  {
    name: 'protocol-relative href',
    input: '<a href="//evil.example">x</a>',
    absent: [/evil/, /href/i],
  },
  {
    name: 'backslash protocol-relative href',
    input: '<a href="/\\evil.example">x</a>',
    absent: [/evil/, /href/i],
  },
  {
    name: 'iframe',
    input: '<iframe src="https://evil.example"></iframe><p>ok</p>',
    absent: [/iframe/i, /evil/],
    present: ['<p>ok</p>'],
  },
  { name: 'svg onload', input: '<svg onload=alert(1)></svg>', absent: [/<svg/i, /onload/i] },
  {
    name: 'style and onclick on p',
    input: '<p style="color:red" onclick="x()">t</p>',
    absent: [/style/i, /onclick/i],
    present: ['<p>t</p>'],
  },
  {
    name: 'style element',
    input: '<style>p{color:red}</style><p>t</p>',
    absent: [/<style/i, /color:red/],
    present: ['<p>t</p>'],
  },
  {
    name: 'comment',
    input: '<p>a</p><!-- <script>alert(1)</script> -->',
    absent: [/<!--/, NO_SCRIPT],
  },
  {
    name: 'mixed-case tags',
    input: '<ScRiPt>alert(1)</ScRiPt><P>t</P>',
    absent: [NO_SCRIPT],
    present: ['<p>t</p>'],
  },
  {
    name: 'dir with a URL value',
    input: '<p dir="javascript:x">t</p>',
    absent: [/dir=/, /javascript/i],
    present: ['<p>t</p>'],
  },
  {
    name: 'lang with an injected attribute',
    input: '<p lang="en onload=x">t</p>',
    absent: [/lang=/, /onload/i],
    present: ['<p>t</p>'],
  },
  {
    name: 'class, id, style',
    input: '<p class="a" id="b">t</p>',
    absent: [/class=/, /id=/],
    present: ['<p>t</p>'],
  },
];

describe('sanitizeCmsHtml XSS table', () => {
  for (const { name, input, absent, present = [] } of cases) {
    it(`${name} (function)`, () => {
      const out = sanitizeCmsHtml(input);
      for (const pattern of absent) expect(out).not.toMatch(pattern);
      for (const text of present) expect(out).toContain(text);
      expect(out).not.toMatch(/\son[a-z]+\s*=/i);
    });

    it(`${name} (CmsHtml)`, () => {
      const { container } = render(<CmsHtml body={input} />);
      // The empty state (shown when nothing survives) has its own svg and classes, so look at the content box only.
      const html = container.querySelector('[class*=content]')?.innerHTML ?? '';
      for (const pattern of absent) expect(html).not.toMatch(pattern);
      expect(container.querySelector('script, iframe, img, style')).toBeNull();
      expect(container.querySelector('[class*=content] svg')).toBeNull();
      for (const element of container.querySelectorAll('*')) {
        for (const attribute of element.getAttributeNames()) {
          expect(attribute.startsWith('on')).toBe(false);
        }
      }
    });
  }

  it('keeps escaped markup written as text', () => {
    const out = sanitizeCmsHtml('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(out).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    // A JSX attribute string would decode the entities itself, so the body goes in as an expression.
    const { container } = render(<CmsHtml body={'<p>&lt;script&gt;x&lt;/script&gt;</p>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>x<' + '/script>');
  });

  it('removes target and forces rel on every kept link', () => {
    const out = sanitizeCmsHtml(
      '<a href="https://example.com" target="_blank" rel="opener" title="t">x</a>',
    );
    expect(out).not.toContain('target');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('title="t"');
  });

  it('keeps http, https, mailto, tel and single-slash relative links', () => {
    for (const href of [
      'http://a.test/',
      'https://a.test/',
      'mailto:a@a.test',
      'tel:+20100',
      '/books',
    ]) {
      expect(sanitizeCmsHtml(`<a href="${href}">x</a>`)).toContain(`href="${href}"`);
    }
  });

  it('turns every h1 into h2 and keeps h2 to h4', () => {
    const out = sanitizeCmsHtml('<h1 dir="rtl">a</h1><h2>b</h2><h3>c</h3><h4>d</h4>');
    expect(out).not.toMatch(/<h1/i);
    expect(out).toBe('<h2 dir="rtl">a</h2><h2>b</h2><h3>c</h3><h4>d</h4>');
    const { container } = render(<CmsHtml body="<h1>a</h1>" />);
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    expect(container.querySelectorAll('h2')).toHaveLength(1);
  });

  it('keeps valid dir and lang on any allowed tag, normalised', () => {
    expect(sanitizeCmsHtml('<p dir="RTL" lang="ar-EG">t</p>')).toBe(
      '<p dir="rtl" lang="ar-EG">t</p>',
    );
    expect(sanitizeCmsHtml('<li dir="auto" lang="en">t</li>')).toBe(
      '<li dir="auto" lang="en">t</li>',
    );
    expect(sanitizeCmsHtml('<p lang="e">t</p>')).toBe('<p>t</p>');
    expect(sanitizeCmsHtml('<p lang="abcdefghijk">t</p>')).toBe('<p>t</p>');
    expect(sanitizeCmsHtml('<p dir="sideways">t</p>')).toBe('<p>t</p>');
  });

  it('keeps colspan and rowspan only as small numbers', () => {
    expect(
      sanitizeCmsHtml('<table><tbody><tr><td colspan="2" rowspan="x">c</td></tr></tbody></table>'),
    ).toBe('<table><tbody><tr><td colspan="2">c</td></tr></tbody></table>');
  });

  it('returns an empty string above the length limit and works at the limit', () => {
    expect(sanitizeCmsHtml('a'.repeat(300_000))).toBe('');
    expect(sanitizeCmsHtml(`<p>${'a'.repeat(MAX_CMS_HTML_LENGTH - 7)}</p>`)).toHaveLength(
      MAX_CMS_HTML_LENGTH - 7 + 7,
    );
    const { container } = render(<CmsHtml body={'<p>x</p>'.repeat(25_000)} />);
    expect(container.querySelector('[class*=content] p')).not.toBeNull();
    const over = render(<CmsHtml body={'<p>x</p>'.repeat(25_001)} />);
    expect(over.container.querySelector('[class*=content]')).toBeNull();
  });

  it('renders the neutral empty state when nothing survives', () => {
    const { container } = render(<CmsHtml body="<script>alert(1)</script>" />);
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });
});

const policyPage = `<h1>Shipping policy</h1>
<p>We ship <strong>every day</strong> except <em>Fridays</em>.</p>
<h2>Fees</h2>
<ul><li>Cairo</li><li>Giza</li></ul>
<ol><li>Order</li><li>Pay</li></ol>
<blockquote><p>Quote</p></blockquote>
<table><thead><tr><th>Zone</th><th>Fee</th></tr></thead><tbody><tr><td>Cairo</td><td>35</td></tr></tbody></table>
<p>See <a href="https://example.com/terms" target="_blank" onclick="x()">the terms</a>.</p>`;

describe('a normal policy page', () => {
  it('matches the snapshot', () => {
    expect(sanitizeCmsHtml(policyPage)).toMatchInlineSnapshot(`
      "<h2>Shipping policy</h2>
      <p>We ship <strong>every day</strong> except <em>Fridays</em>.</p>
      <h2>Fees</h2>
      <ul><li>Cairo</li><li>Giza</li></ul>
      <ol><li>Order</li><li>Pay</li></ol>
      <blockquote><p>Quote</p></blockquote>
      <table><thead><tr><th>Zone</th><th>Fee</th></tr></thead><tbody><tr><td>Cairo</td><td>35</td></tr></tbody></table>
      <p>See <a href="https://example.com/terms" rel="noopener noreferrer nofollow">the terms</a>.</p>"
    `);
  });

  it('passes axe and wraps the table in a scroll box', async () => {
    const { container } = render(<CmsHtml body={policyPage} />);
    expect(container.querySelector('table')?.parentElement?.className).toMatch(/scroll/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
