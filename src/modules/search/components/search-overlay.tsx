'use client';

import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { bookRoute, routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import { Modal } from '@/shared/ui/modal';
import { SafeImage } from '@/shared/ui/safe-image';

import { getSuggestions, type BookSuggestion } from '../api/get-suggestions';
import styles from './search-overlay.module.css';

export const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
export type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

export function SearchOverlay({
  initialState = 'idle',
  initialSuggestions = [],
  previewLabel,
}: {
  initialState?: SearchState;
  initialSuggestions?: BookSuggestion[];
  previewLabel?: string;
} = {}) {
  const text = messages.search;
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>(initialState);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>(initialSuggestions);
  const [selected, setSelected] = useState(-1);
  const listId = useId();
  const formId = useId();
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (!isOpen || q.length < MIN_SEARCH_LENGTH) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState('loading');
      void getSuggestions(q, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setSuggestions(items);
          setState(items.length ? 'results' : 'empty');
        })
        .catch(() => {
          if (!controller.signal.aborted) setState('error');
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  function onQueryChange(value: string) {
    setQuery(value);
    setSelected(-1);
    setSuggestions([]);
    setState('idle');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault();
      setSelected((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault();
      setSelected((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && selected >= 0) {
      const item = suggestions[selected];
      if (item) {
        event.preventDefault();
        setOpen(false);
        router.push(bookRoute(item.slug));
      }
    }
  }

  return (
    <>
      <form
        action={routes.books}
        aria-label={previewLabel}
        className={styles.trigger}
        method="get"
        role="search"
      >
        <Icon name="search" />
        <input
          aria-label={messages.site.search.label}
          name="q"
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter') {
              event.preventDefault();
              setOpen(true);
            }
          }}
          placeholder={messages.site.search.placeholder}
          type="search"
        />
      </form>
      {/* Small screens hide the inline field (see the header); this round button opens the same dialog. */}
      <button
        aria-label={text.open}
        className={styles.openButton}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Icon name="search" />
      </button>
      <Modal closeLabel={text.close} onOpenChange={setOpen} open={isOpen} title={text.title}>
        <form action={routes.books} className={styles.bar} id={formId} method="get" role="search">
          <label className={styles.field}>
            <Icon name="search" />
            <input
              aria-activedescendant={selected >= 0 ? `${listId}-${selected}` : undefined}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={state === 'results'}
              aria-label={messages.site.search.label}
              autoComplete="off"
              data-autofocus
              name="q"
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={messages.site.search.placeholder}
              role="combobox"
              type="search"
              value={query}
            />
          </label>
        </form>
        <div aria-live="polite" className={styles.status}>
          {state === 'idle'
            ? text.idle
            : state === 'loading'
              ? text.loading
              : state === 'empty'
                ? text.empty
                : state === 'error'
                  ? text.error
                  : null}
        </div>
        <ul className={styles.results} id={listId} role="listbox">
          {suggestions.map((item, index) => (
            // An option must not contain a link (axe: nested interactive). Keyboard users pick with the arrow keys and
            // Enter on the combobox, so this click handler is the pointer path only.
            <li
              aria-selected={index === selected}
              className={styles.item}
              id={`${listId}-${index}`}
              key={item.slug}
              onClick={() => {
                setOpen(false);
                router.push(bookRoute(item.slug));
              }}
              role="option"
            >
              <span className={styles.itemLink}>
                <SafeImage
                  className={styles.thumb}
                  decorative
                  height={54}
                  src={item.coverImageUrl}
                  width={38}
                />
                <span className={styles.itemTitle}>{item.title}</span>
              </span>
            </li>
          ))}
        </ul>
        {state === 'results' ? (
          <button className={styles.all} form={formId} type="submit">
            <span>{text.allResults}</span>
            <Icon name="arrow" size="sm" />
          </button>
        ) : null}
      </Modal>
    </>
  );
}
