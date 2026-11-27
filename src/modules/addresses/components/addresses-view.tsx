'use client';

import { useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import { UnconfirmedEmailBanner } from '@/modules/account';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon } from '@/shared/ui/icon';
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
    <section className={styles.page}>
      <div className={styles.head}>
        <h1>{text.title}</h1>
        <p className={styles.subtitle}>{messages.account.addressesSubtitle}</p>
      </div>
      {isEmailUnconfirmed ? <UnconfirmedEmailBanner /> : null}
      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <>
          <span>{text.loading}</span>
          <Skeleton shape="card" />
        </>
      ) : (
        <>
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
              <button
                aria-describedby="address-add-hint"
                className={styles.add}
                onClick={() => setEditing(null)}
                type="button"
              >
                <span aria-hidden="true" className={styles.addPlus}>
                  <Icon name="plus" size="lg" />
                </span>
                <b>{text.add}</b>
                <span aria-hidden="true" id="address-add-hint">
                  {text.addHint}
                </span>
              </button>
            </div>
          ) : !error && !isEmailUnconfirmed ? (
            <EmptyState
              action={
                <Button leadingIcon="plus" onClick={() => setEditing(null)}>
                  {text.add}
                </Button>
              }
              icon="pin"
              title={text.emptyTitle}
              description={text.emptyDescription}
            />
          ) : null}
          {zones.length ? (
            <section aria-labelledby="address-zones-title" className={styles.zones}>
              <h2 id="address-zones-title">{text.zonesTitle}</h2>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{text.shippingZoneId}</th>
                    <th scope="col">{text.estimatedDays}</th>
                    <th scope="col">{text.shippingPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td>{zone.nameAr}</td>
                      <td>
                        {zone.estimatedDays === null
                          ? '—'
                          : text.deliveryDays.replace('{days}', formatNumber(zone.estimatedDays))}
                      </td>
                      <td>
                        <b>{formatMoney(zone.shippingPrice)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
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
          <Button
            className={styles.danger}
            disabled={isBusy}
            onClick={() => {
              if (deleting) void perform(() => deleteAddress(deleting.id));
            }}
            variant="outline"
          >
            {text.delete}
          </Button>
          <Button disabled={isBusy} onClick={() => setDeleting(null)} variant="soft">
            {text.cancel}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
