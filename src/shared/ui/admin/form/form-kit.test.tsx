import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { DateInput, isValidDateValue } from './date-input';
import { FormBanner } from './form-banner';
import { MoneyInput, parseMoney } from './money-input';
import { MultiSelect } from './multi-select';
import { RichHtmlField } from './rich-html-field';
import { useAdminForm } from './use-admin-form';
import { isoDate, maxItems, maxLength, numberRange, required, validateForm } from './validation';

const copy = messages.admin.form;

describe('validation rules', () => {
  it('required rejects empty text, null and an empty list', () => {
    expect(required<string>()('  ')).toBe(copy.required);
    expect(required<number | null>()(null)).toBe(copy.required);
    expect(required<string[]>()([])).toBe(copy.required);
    expect(required<string>()('x')).toBeNull();
  });

  it('checks the contract limits', () => {
    expect(maxLength(3)('abcd')).toBe(copy.maxLength.replace('{max}', '3'));
    expect(maxLength(3)('abc')).toBeNull();
    expect(numberRange(1, 10)(11)).toBe(copy.range.replace('{min}', '1').replace('{max}', '10'));
    expect(numberRange(1, 10)(null)).toBeNull();
    expect(maxItems<string>(2)(['a', 'b', 'c'])).toBe(copy.maxItems.replace('{max}', '2'));
  });

  it('isoDate accepts a real day only', () => {
    expect(isoDate()('')).toBeNull();
    expect(isoDate()('2026-02-28')).toBeNull();
    expect(isoDate()('2026-02-30')).toBe(copy.dateInvalid);
    expect(isoDate()('28/02/2026')).toBe(copy.dateInvalid);
  });

  it('validateForm keeps the first failing rule of each field', () => {
    const errors = validateForm(
      { a: '', b: 'xx' },
      { a: [required(), maxLength(1)], b: [maxLength(1)] },
    );

    expect(errors).toEqual({ a: copy.required, b: copy.maxLength.replace('{max}', '1') });
  });
});

describe('parseMoney', () => {
  it('keeps the typed number as it is', () => {
    expect(parseMoney('150')).toBe(150);
    expect(parseMoney('1,250.5')).toBe(1250.5);
    expect(parseMoney('١٢٣٫٤٥')).toBe(123.45);
    expect(parseMoney('')).toBeNull();
  });

  it('refuses a negative amount, letters and three decimals', () => {
    expect(parseMoney('-5')).toBe('invalid');
    expect(parseMoney('12a')).toBe('invalid');
    expect(parseMoney('1.234')).toBe('invalid');
  });
});

function MoneyHarness({ onValue }: { onValue: (value: number | null) => void }) {
  const [value, setValue] = useState<number | null>(null);

  return (
    <label>
      المبلغ
      <MoneyInput
        value={value}
        onChange={(next) => {
          setValue(next);
          onValue(next);
        }}
      />
    </label>
  );
}

describe('MoneyInput', () => {
  it('sends a number, shows formatMoney when it loses focus and the raw text when focused', () => {
    const onValue = vi.fn();

    render(<MoneyHarness onValue={onValue} />);

    const box = screen.getByRole<HTMLInputElement>('textbox');

    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: '1250.5' } });
    expect(onValue).toHaveBeenLastCalledWith(1250.5);

    fireEvent.blur(box);
    expect(box.value).toMatch(/1[.,٬]?250/);
    expect(box.value).not.toBe('1250.5');

    fireEvent.focus(box);
    expect(box.value).toBe('1250.5');
  });

  it('flags an invalid amount without calling onChange', () => {
    const onValue = vi.fn();

    render(<MoneyHarness onValue={onValue} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });

    expect(screen.getByRole('alert')).toHaveTextContent(copy.moneyInvalid);
    expect(onValue).not.toHaveBeenCalled();
  });
});

describe('DateInput', () => {
  it('shows the Cairo end-of-day note only for a date that ends something', () => {
    const { rerender } = render(<DateInput isEndOfDay mode="date" value="" onChange={vi.fn()} />);

    expect(screen.getByText(copy.endOfDayNote)).toBeInTheDocument();

    rerender(<DateInput mode="datetime" value="" onChange={vi.fn()} />);
    expect(screen.queryByText(copy.endOfDayNote)).not.toBeInTheDocument();
  });

  it('passes the typed value and validates the shapes', () => {
    const onChange = vi.fn();

    render(<DateInput mode="date" value="" onChange={onChange} />);
    const box = document.querySelector('input[type="date"]');

    fireEvent.change(box as Element, { target: { value: '2026-03-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-03-01');
    expect(isValidDateValue('2026-03-01', 'date')).toBe(true);
    expect(isValidDateValue('2026-03-01T10:30', 'datetime')).toBe(true);
    expect(isValidDateValue('2026-03-01', 'datetime')).toBe(false);
  });
});

const OPTIONS = [
  { label: 'سامي', value: '1' },
  { label: 'منى', value: '2' },
  { label: 'رنا', value: '3' },
];

function MultiHarness({ max }: { max?: number }) {
  const [value, setValue] = useState<string[]>([]);

  return <MultiSelect maxSelected={max} options={OPTIONS} value={value} onChange={setValue} />;
}

describe('MultiSelect', () => {
  it('selects, shows chips, removes and filters by search', async () => {
    const { container } = render(<MultiHarness />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'سامي' }));
    expect(screen.getByRole('list', { name: copy.selectedLabel })).toHaveTextContent('سامي');

    fireEvent.click(
      screen.getByRole('button', { name: copy.removeItem.replace('{name}', 'سامي') }),
    );
    expect(screen.queryByRole('list', { name: copy.selectedLabel })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'منى' } });
    expect(screen.queryByRole('checkbox', { name: 'سامي' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'منى' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('stops at the maximum', () => {
    render(<MultiHarness max={1} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'سامي' }));
    expect(screen.getByRole('checkbox', { name: 'منى' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'سامي' })).toBeEnabled();
  });
});

const previewOf = (html: string) => <div data-testid="preview">{html}</div>;

function RichHarness() {
  const [value, setValue] = useState('نص');

  return <RichHtmlField id="body" renderPreview={previewOf} value={value} onChange={setValue} />;
}

describe('RichHtmlField', () => {
  it('wraps the selection in a tag from the toolbar', () => {
    render(<RichHarness />);

    const area = screen.getByRole<HTMLTextAreaElement>('textbox');

    area.setSelectionRange(0, 2);
    fireEvent.select(area);
    fireEvent.click(screen.getByRole('button', { name: copy.rich.bold }));

    expect(area.value).toBe('<strong>نص</strong>');
  });

  it('hands the current html to the caller renderer, which owns sanitizing, and locks the toolbar', () => {
    function Harness() {
      const [value, setValue] = useState('<p>مرحبا</p><script>window.__hacked = 1</script>');

      return <RichHtmlField renderPreview={previewOf} value={value} onChange={setValue} />;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: copy.rich.preview }));

    const box = screen.getByRole('region', { name: copy.rich.previewLabel });

    expect(box).toHaveTextContent('مرحبا');
    expect(screen.getByRole('button', { name: copy.rich.bold })).toBeDisabled();
    expect(box.querySelector('script')).toBeNull();
    expect((window as unknown as { __hacked?: number }).__hacked).toBeUndefined();
  });
});

type Values = { code: string; amount: number | null };
const SCHEMA = { code: [required<string>(), maxLength(5)], amount: [required<number | null>()] };
const INITIAL: Values = { code: '', amount: null };

function setup(onSubmit: (values: Values) => Promise<void>) {
  return renderHook(() =>
    useAdminForm<Values>({ initialValues: INITIAL, onSubmit, schema: SCHEMA }),
  );
}

describe('useAdminForm', () => {
  it('shows client errors and does not call the server', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = setup(onSubmit);

    await act(async () => result.current.handleSubmit());

    expect(result.current.errors.code).toBe(copy.required);
    expect(result.current.errors.amount).toBe(copy.required);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('puts errors.<field> from a 400 under the right field (camelCase) and clears it on edit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 400,
        errors: { Code: ['مستخدم'], Amount: ['كبير'] },
      }),
    );
    const { result } = setup(onSubmit);

    act(() => {
      result.current.setValue('code', 'abc');
      result.current.setValue('amount', 5);
    });
    await act(async () => result.current.handleSubmit());

    expect(result.current.errors).toEqual({ code: 'مستخدم', amount: 'كبير' });
    expect(result.current.formError).toBeNull();

    act(() => result.current.setValue('code', 'abd'));
    expect(result.current.errors.code).toBeUndefined();
    expect(result.current.errors.amount).toBe('كبير');
  });

  it('sends an error with no field (and a field the form does not have) to the banner', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError({ kind: 'problem', status: 422 }));
    const { result } = setup(onSubmit);

    act(() => {
      result.current.setValue('code', 'abc');
      result.current.setValue('amount', 5);
    });
    await act(async () => result.current.handleSubmit());
    expect(result.current.formError).toBeTruthy();

    onSubmit.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 400, errors: { Unknown: ['رسالة غريبة'] } }),
    );
    await act(async () => result.current.handleSubmit());
    expect(result.current.formError).toBe('رسالة غريبة');
  });

  it('sends once at a time and tracks dirty / reset', async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result } = setup(onSubmit);

    act(() => {
      result.current.setValue('code', 'abc');
      result.current.setValue('amount', 5);
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      void result.current.handleSubmit();
      void result.current.handleSubmit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => finish());
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.setValue('code', 'zzz'));
    act(() => result.current.reset());
    expect(result.current.values.code).toBe('abc');
  });
});

describe('FormBanner', () => {
  it('renders an alert only when there is a message', () => {
    const { rerender } = render(<FormBanner message={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<FormBanner message="خطأ عام" />);
    expect(screen.getByRole('alert')).toHaveTextContent('خطأ عام');
  });
});
