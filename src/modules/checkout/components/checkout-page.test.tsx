import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/i18n/messages/ar.json';
import { server } from '@/mocks/server';
import { createBrowserClient } from '@/shared/lib/api';
import { CheckoutProvider } from '../provider/checkout-provider';
import { CheckoutPage } from './checkout-page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/modules/auth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: {
      id: 1,
      email: 'reader@example.com',
      fullName: 'Reader',
      phone: null,
      emailConfirmed: true,
      roles: ['Customer'],
      permissions: [],
    },
    login: vi.fn(),
    logout: vi.fn(),
  }),
  getApiClient: () =>
    createBrowserClient({
      getAccessToken: () => 'token',
      onUnauthorized: () => undefined,
    }),
  getAuthApi: () => ({
    me: () =>
      Promise.resolve({
        id: 1,
        email: 'reader@example.com',
        fullName: 'Reader',
        phone: null,
        emailConfirmed: true,
        roles: ['Customer'],
        permissions: [],
      }),
  }),
}));

const problem403 = () =>
  HttpResponse.json(
    {
      type: 'https://alasma.local/errors/email-not-confirmed',
      title: 'Email not confirmed',
      status: 403,
      code: 'email_not_confirmed',
    },
    { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
  );

function installCheckoutHandlers() {
  server.use(
    http.get('*/api/v1/cart', () =>
      HttpResponse.json({
        items: [
          {
            itemId: 1,
            kind: 'Book',
            bookId: 10,
            bundleId: null,
            title: 'Book',
            slug: 'book',
            coverImageUrl: null,
            unitPrice: 100,
            finalUnitPrice: 100,
            discountPercent: 0,
            quantity: 1,
            lineTotal: 100,
            stockStatus: 'InStock',
            availableQuantity: 5,
            isAvailable: true,
            unavailableReason: null,
          },
        ],
        subtotal: 100,
        totalItemsCount: 1,
        hasUnavailableItems: false,
      }),
    ),
    http.get('*/api/v1/me/addresses', () =>
      HttpResponse.json([
        {
          id: 1,
          recipientName: 'Reader',
          phone: '01012345678',
          shippingZoneId: 1,
          governorateName: 'Cairo',
          city: 'Nasr City',
          addressLine: 'Street 1',
          landmark: null,
          isDefault: true,
        },
      ]),
    ),
    http.get('*/api/v1/shipping/zones', () =>
      HttpResponse.json([
        {
          id: 1,
          nameAr: 'Cairo',
          nameEn: 'Cairo',
          shippingPrice: 30,
          freeShippingThreshold: null,
          estimatedDays: '2-3',
        },
      ]),
    ),
    http.get('*/api/v1/payment-methods', () =>
      HttpResponse.json([{ method: 'CashOnDelivery', details: null }]),
    ),
    http.post('*/api/v1/checkout/preview', () =>
      HttpResponse.json({
        items: [
          {
            kind: 'Book',
            bookId: 10,
            bundleId: null,
            title: 'Book',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
            warning: null,
            availableQuantity: 5,
          },
        ],
        subtotal: 100,
        couponCode: null,
        couponDiscount: 0,
        shippingFee: 30,
        freeShippingApplied: false,
        total: 130,
        zone: { id: 1, governorate: 'Cairo', freeShippingThreshold: null, shippingFee: 30 },
      }),
    ),
  );
}

describe('checkout confirmation guard', () => {
  it('renders the real checkout composition and shows exactly one banner when order creation returns 403 email_not_confirmed', async () => {
    installCheckoutHandlers();
    server.use(http.post('*/api/v1/orders', () => problem403()));

    render(
      <CheckoutProvider>
        <CheckoutPage />
      </CheckoutProvider>,
    );

    const paymentRadio = await screen.findByRole('radio', {
      name: messages.checkout.cashOnDelivery,
    });
    fireEvent.click(paymentRadio);

    const placeButton = await screen.findByRole('button', { name: messages.checkout.placeOrder });
    expect(placeButton).toBeEnabled();
    fireEvent.click(placeButton);

    const banners = await screen.findAllByRole('region', { name: messages.account.unconfirmed });
    expect(banners).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: messages.checkout.placeOrder }),
    ).not.toBeInTheDocument();
  });

  it('shows exactly one banner when both cart and checkout operations report 403 email_not_confirmed', async () => {
    installCheckoutHandlers();
    server.use(
      http.get('*/api/v1/cart', () => problem403()),
      http.get('*/api/v1/me/addresses', () => problem403()),
    );

    render(
      <CheckoutProvider>
        <CheckoutPage />
      </CheckoutProvider>,
    );

    const banners = await screen.findAllByRole('region', { name: messages.account.unconfirmed });
    expect(banners).toHaveLength(1);
  });
});
