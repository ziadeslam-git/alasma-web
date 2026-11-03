'use client';

import { useCallback, useEffect, useState } from 'react';
import messages from '@/i18n/messages/ar.json';
import {
  AddressCard,
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
import { Skeleton } from '@/shared/ui/skeleton';
import { Modal } from '@/shared/ui/modal';
import { previewCheckout } from '../api/preview';
import { useCheckout } from '../provider/checkout-provider';

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
    <section aria-labelledby="checkout-address-title">
      <h2 id="checkout-address-title">{messages.checkout.addressTitle}</h2>
      {isLoading ? <Skeleton shape="card" /> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!isLoading && !isAdding && !editing ? (
        <>
          <fieldset>
            <legend>{messages.checkout.chooseAddress}</legend>
            {addresses.map((address) => (
              <div key={address.id}>
                <label>
                  <input
                    type="radio"
                    name="addressId"
                    checked={address.id === addressId}
                    onChange={() => {
                      beginPreviewRequest();
                      setAddressId(address.id);
                    }}
                  />
                  {address.recipientName} — {address.city}
                </label>
                <AddressCard
                  address={address}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onDefault={(item) => {
                    if (!fixtures) void update(() => setDefaultAddress(item.id));
                  }}
                />
              </div>
            ))}
          </fieldset>
          <button type="button" onClick={() => setAdding(true)}>
            {messages.addresses.add}
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
        <button
          type="button"
          onClick={() => {
            const target = deleting;
            setDeleting(null);
            if (target && !fixtures) void update(() => deleteAddress(target.id));
          }}
        >
          {messages.addresses.delete}
        </button>
        <button type="button" onClick={() => setDeleting(null)}>
          {messages.addresses.cancel}
        </button>
      </Modal>
    </section>
  );
}
