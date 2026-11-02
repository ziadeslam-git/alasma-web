'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { EmptyState } from '@/shared/ui/empty-state';
import { Modal } from '@/shared/ui/modal';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  listShippingZones,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
  type ShippingZone,
} from '../api/addresses';
import { AddressCard } from './address-card';
import { AddressForm } from './address-form';
import styles from './addresses.module.css';

export type AddressFixtures = { addresses: Address[]; zones: ShippingZone[] };
export function AddressesView({ fixtures }: { fixtures?: AddressFixtures }) {
  const text = messages.addresses;
  const [items, setItems] = useState<Address[]>(fixtures?.addresses ?? []);
  const [zones, setZones] = useState<ShippingZone[]>(fixtures?.zones ?? []);
  const [isLoading, setLoading] = useState(!fixtures);
  const [editing, setEditing] = useState<Address | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isEmailUnconfirmed, setEmailUnconfirmed] = useState(false);

  async function refresh() {
    const [addresses, shippingZones] = await Promise.all([listAddresses(), listShippingZones()]);
    setItems(addresses);
    setZones(shippingZones);
  }
  useEffect(() => {
    if (fixtures) return;
    let isActive = true;
    void Promise.all([listAddresses(), listShippingZones()])
      .then(([addresses, shippingZones]) => {
        if (isActive) {
          setItems(addresses);
          setZones(shippingZones);
        }
      })
      .catch((caught: unknown) => {
        if (
          isActive &&
          caught instanceof ApiError &&
          caught.status === 403 &&
          caught.code === 'email_not_confirmed'
        ) {
          setEmailUnconfirmed(true);
        } else if (isActive)
          setError(
            caught instanceof ApiError ? getApiErrorMessage(caught) : messages.apiErrors.generic,
          );
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [fixtures]);

  async function save(input: AddressInput) {
    if (fixtures) return;
    if (editing) await updateAddress(editing.id, input);
    else await createAddress(input);
    await refresh();
    setEditing(undefined);
  }
  async function perform(action: () => Promise<unknown>) {
    if (fixtures) return;
    setBusy(true);
    setError('');
    setEmailUnconfirmed(false);
    try {
      await action();
      await refresh();
      setDeleting(null);
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.status === 403 &&
        caught.code === 'email_not_confirmed'
      )
        setEmailUnconfirmed(true);
      else
        setError(
          caught instanceof ApiError ? getApiErrorMessage(caught) : messages.apiErrors.generic,
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>{text.title}</h1>
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      {error ? <p role="alert">{error}</p> : null}
      {isLoading ? (
        <>
          <span>{text.loading}</span>
          <Skeleton shape="card" />
        </>
      ) : (
        <>
          <button type="button" onClick={() => setEditing(null)}>
            {text.add}
          </button>
          {items.length ? (
            <div className={styles.list}>
              {items.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onDefault={(item) => void perform(() => setDefaultAddress(item.id))}
                />
              ))}
            </div>
          ) : !error && !isEmailUnconfirmed ? (
            <EmptyState icon="user" title={text.emptyTitle} description={text.emptyDescription} />
          ) : null}
        </>
      )}
      <Modal
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        title={editing ? text.edit : text.add}
        closeLabel={text.close}
      >
        {editing !== undefined ? (
          <AddressForm
            key={editing?.id ?? 'new'}
            address={editing ?? undefined}
            zones={zones}
            onSave={save}
            onCancel={() => setEditing(undefined)}
          />
        ) : null}
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isBusy) setDeleting(null);
        }}
        title={text.delete}
        description={text.confirmDelete}
        closeLabel={text.close}
        role="alertdialog"
      >
        <div className={styles.actions}>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (deleting) void perform(() => deleteAddress(deleting.id));
            }}
          >
            {text.delete}
          </button>
          <button type="button" disabled={isBusy} onClick={() => setDeleting(null)}>
            {text.cancel}
          </button>
        </div>
      </Modal>
    </section>
  );
}
