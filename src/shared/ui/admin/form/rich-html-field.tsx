'use client';

import { useRef, useState, type ReactNode } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/input';

import styles from './form.module.css';

const copy = messages.admin.form.rich;

type Tool = { key: 'bold' | 'italic' | 'heading' | 'list'; open: string; close: string };

// Only tags the public page allows (sanitize-cms-html). Nothing here can write a script: the backend sanitizes the
// HTML on save and the preview below is the same CmsHtml the public page uses, which sanitizes it again.
const TOOLS: readonly Tool[] = [
  { key: 'bold', open: '<strong>', close: '</strong>' },
  { key: 'italic', open: '<em>', close: '</em>' },
  { key: 'heading', open: '<h2>', close: '</h2>' },
  { key: 'list', open: '<ul><li>', close: '</li></ul>' },
];

export type RichHtmlFieldProps = {
  onChange: (value: string) => void;
  // Shows the html the way the public page does. The caller passes `CmsHtml` (modules/pages): shared code may not
  // import a module, and the preview must be the one component that sanitizes and renders the public body.
  renderPreview: (html: string) => ReactNode;
  value: string;
  id?: string;
  isDisabled?: boolean;
};

// A small editor: a toolbar that wraps the selected text in a tag, and a preview tab. No WYSIWYG.
export function RichHtmlField({
  id,
  isDisabled = false,
  onChange,
  renderPreview,
  value,
}: RichHtmlFieldProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const rootRef = useRef<HTMLDivElement>(null);

  // The selection is read from the box at the click, so it is always the one the user sees.
  const apply = (tool: Tool) => {
    const area = rootRef.current?.querySelector('textarea');

    if (!area) return;

    const { selectionStart: start, selectionEnd: end } = area;
    const chosen = value.slice(start, end);

    onChange(`${value.slice(0, start)}${tool.open}${chosen}${tool.close}${value.slice(end)}`);
  };

  return (
    <div ref={rootRef} className={styles.rich}>
      <div className={styles.richBar}>
        <div aria-label={copy.toolbar} className={styles.tools} role="toolbar">
          {TOOLS.map((tool) => (
            <Button
              key={tool.key}
              disabled={isDisabled || tab === 'preview'}
              size="sm"
              variant="outline"
              onClick={() => apply(tool)}
            >
              {copy[tool.key]}
            </Button>
          ))}
        </div>

        <div className={styles.tabs}>
          <Button
            aria-pressed={tab === 'write'}
            size="sm"
            variant={tab === 'write' ? 'soft' : 'ghost'}
            onClick={() => setTab('write')}
          >
            {copy.write}
          </Button>
          <Button
            aria-pressed={tab === 'preview'}
            size="sm"
            variant={tab === 'preview' ? 'soft' : 'ghost'}
            onClick={() => setTab('preview')}
          >
            {copy.preview}
          </Button>
        </div>
      </div>

      {tab === 'write' ? (
        <Textarea
          dir="auto"
          disabled={isDisabled}
          id={id}
          rows={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div aria-label={copy.previewLabel} className={styles.previewBox} role="region">
          {renderPreview(value)}
        </div>
      )}
    </div>
  );
}
