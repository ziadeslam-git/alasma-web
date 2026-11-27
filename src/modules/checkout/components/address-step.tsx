'use client';

import { useCallback, useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import {
  AddressForm,
  createAddress,
  deleteAddress,
  listAddresses,
  listShippingZones,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
  type ShippingZone,
} from '@/modules/addresses';
import { ApiError, getApiErrorMessage } from '@/shared/lib/api';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Skeleton } from '@/shared/ui/skeleton';
import { Modal } from '@/shared/ui/modal';
import { previewCheckout } from '../api/preview';
import { useCheckout } from '../provider/checkout-provider';
import { CheckoutOption } from './checkout-option';
import { CheckoutPanel } from './checkout-panel';
import styles from './address-step.module.css';

export type AddressStepFixtures = {
  addresses: Address[];
  zones: ShippingZone[];
  loading?: boolean;
};

export function AddressStep({ fixtures }: { fixtures?: AddressStepFixtures }) {
  const {
    addressId,
    setAddressId,
    appliedCouponCode,
    setPreview,
    beginPreviewRequest,
    isCurrentPreviewRequest,
    setEmailUnconfirmed,
  } = useCheckout();
  const [addresses, setAddresses] = useState<Address[]>(fixtures?.addresses ?? []);
  const [zones, setZones] = useState<ShippingZone[]>(fixtures?.zones ?? []);
  const [isLoading, setLoading] = useState(!fixtures || Boolean(fixtures.loading));
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Address | null>(null);
  const [revision, setRevision] = useState(0);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [isAdding, setAdding] = useState(Boolean(fixtures && fixtures.addresses.length === 0));

  const load = useCallback(
    async (preferredId?: number) => {
      const [items, availableZones] = await Promise.all([listAddresses(), listShippingZones()]);
      setAddresses(items);
      setZones(availableZones);
      setAddressId(
        items.find((item) => item.id === preferredId)?.id ??
          items.find((item) => item.id === addressId)?.id ??
          items.find((item) => item.isDefault)?.id ??
          items[0]?.id ??
          null,
      );
      setAdding(items.length === 0);
    },
    [addressId, setAddressId],
  );

  useEffect(() => {
    if (!fixtures || addressId !== null || !fixtures.addresses.length) return;
    setAddressId(
      fixtures.addresses.find((item) => item.isDefault)?.id ?? fixtures.addresses[0]?.id ?? null,
    );
  }, [fixtures, addressId, setAddressId]);

  useEffect(() => {
    if (fixtures) return;
    let isActive = true;
    void Promise.all([listAddresses(), listShippingZones()])
      .then(([items, availableZones]) => {
        if (!isActive) return;
        setAddresses(items);
        setZones(availableZones);
        setAddressId(items.find((item) => item.isDefault)?.id ?? items[0]?.id ?? null);
        setAdding(items.length === 0);
      })
      .catch((cause: unknown) => {
        if (
          isActive &&
          cause instanceof ApiError &&
          cause.status === 403 &&
          cause.code === 'email_not_confirmed'
        )
          setEmailUnconfirmed(true);
        else if (isActive)
          setError(
            cause instanceof ApiError ? getApiErrorMessage(cause) : messages.apiErrors.generic,
          );
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [fixtures, setAddressId, setEmailUnconfirmed]);

  useEffect(() => {
    if (addressId === null || fixtures) return;
    let isActive = true;
    const version = beginPreviewRequest();
    setPreview({ status: 'loading' });
    void previewCheckout({ addressId, zoneId: null, couponCode: appliedCouponCode })
      .then((data) => {
        if (isActive && isCurrentPreviewRequest(version)) setPreview({ status: 'ok', data });
      })
      .catch((cause: unknown) => {
        if (
          isActive &&
          cause instanceof ApiError &&
          cause.status === 403 &&
          cause.code === 'email_not_confirmed'
        )
          setEmailUnconfirmed(true);
        else if (isActive && isCurrentPreviewRequest(version))
          setPreview({
            status: 'error',
            message:
              cause instanceof ApiError ? getApiErrorMessage(cause) : messages.apiErrors.generic,
          });
      });
    return () => {
      isActive = false;
    };
  }, [
    addressId,
    appliedCouponCode,
    revision,
    fixtures,
    setPreview,
    beginPreviewRequest,
    isCurrentPreviewRequest,
    setEmailUnconfirmed,
  ]);

  async function save(input: AddressInput) {
    if (fixtures) return;
    let selectedId = editing?.id;
    try {
      if (editing) await updateAddress(editing.id, input);
      else selectedId = (await createAddress(input)).data?.id;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403 && cause.code === 'email_not_confirmed')
        setEmailUnconfirmed(true);
      throw cause;
    }
    setEditing(null);
    await load(selectedId);
    setRevision((value) => value + 1);
  }

  async function update(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403 && cause.code === 'email_not_confirmed')
        setEmailUnconfirmed(true);
      else
        setError(
          cause instanceof ApiError ? getApiErrorMessage(cause) : messages.apiErrors.generic,
        );
    }
  }

  return (
    <CheckoutPanel step={1} title={messages.checkout.addressTitle} titleId="checkout-address-title">
      {isLoading ? <Skeleton shape="card" /> : null}
      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && !isAdding && !editing ? (
        <>
          <fieldset className={styles.list}>
            <legend className={styles.srOnly}>{messages.checkout.chooseAddress}</legend>
            {addresses.map((address) => (
              <div className={styles.entry} key={address.id}>
                <CheckoutOption
                  badge={
                    address.isDefault ? (
                      <span className={styles.tag}>{messages.checkout.defaultTag}</span>
                    ) : null
                  }
                  checked={address.id === addressId}
                  description={[
                    address.addressLine,
                    `${address.governorateName} - ${address.city}`,
                    address.landmark,
                    address.phone,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  name="addressId"
                  onChange={() => {
                    beginPreviewRequest();
                    setAddressId(address.id);
                  }}
                  title={`${address.recipientName} — ${address.city}`}
                />
                <div className={styles.actions}>
                  <Button
                    leadingIcon="settings"
                    onClick={() => setEditing(address)}
                    size="sm"
                    variant="outline"
                  >
                    {messages.addresses.edit}
                  </Button>
                  {!address.isDefault ? (
                    <Button
                      onClick={() => {
                        if (!fixtures) void update(() => setDefaultAddress(address.id));
                      }}
                      size="sm"
                      variant="soft"
                    >
                      {messages.addresses.setDefault}
                    </Button>
                  ) : null}
                  <Button
                    className={styles.danger}
                    label={messages.addresses.delete}
                    leadingIcon="trash"
                    onClick={() => setDeleting(address)}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>
            ))}
          </fieldset>
          <button className={styles.add} type="button" onClick={() => setAdding(true)}>
            <Icon name="plus" size="sm" />
            {messages.checkout.addAddress}
          </button>
        </>
      ) : null}
      {!isLoading && (isAdding || editing) ? (
        <AddressForm
          key={editing?.id ?? 'new'}
          address={editing ?? undefined}
          zones={zones}
          onSave={save}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      ) : null}
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={messages.addresses.confirmDelete}
        closeLabel={messages.addresses.close}
      >
        <div className={styles.modalActions}>
          <Button
            className={styles.danger}
            onClick={() => {
              const target = deleting;
              setDeleting(null);
              if (target && !fixtures) void update(() => deleteAddress(target.id));
            }}
            variant="outline"
          >
            {messages.addresses.delete}
          </Button>
          <Button onClick={() => setDeleting(null)} variant="soft">
            {messages.addresses.cancel}
          </Button>
        </div>
      </Modal>
    </CheckoutPanel>
  );
}
