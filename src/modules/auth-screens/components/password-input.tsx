'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { Icon } from '@/shared/ui/icon';
import { Input, type InputProps } from '@/shared/ui/input';

import styles from './password-input.module.css';

export type PasswordInputProps = Omit<InputProps, 'endAdornment' | 'startAdornment' | 'type'>;

// A password field with a show/hide button at its inline end. The eye icon is the only one in the design set, so the
// "visible" state adds a slash over it (CSS); the real state is carried by aria-pressed and the changing label.
export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const text = messages.auth;

  return (
    <Input
      {...props}
      endAdornment={
        <button
          aria-label={isVisible ? text.hidePassword : text.showPassword}
          aria-pressed={isVisible}
          className={styles.toggle}
          disabled={props.disabled}
          // Keeps the focus (and the caret) in the input when the mouse is used; the keyboard path is unaffected.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          <span className={styles.icon}>
            <Icon name="eye" size="sm" />
            {isVisible ? <span aria-hidden="true" className={styles.slash} /> : null}
          </span>
        </button>
      }
      type={isVisible ? 'text' : 'password'}
    />
  );
}
