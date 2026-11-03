import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { absoluteUrl } from '@/shared/config/site';

export type BuildPageMetadataOptions = {
  title: string;
  description?: string | null | undefined;
  path: string;
  image?: string | null | undefined;
  noindex?: boolean | undefined;
  follow?: boolean | undefined;
};

export function isHttpsImageUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
  follow = true,
}: BuildPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const resolvedDescription = description?.trim() || messages.seo.defaultDescription;
  const hasHttpsImage = isHttpsImageUrl(image);

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: canonical,
      siteName: messages.seo.siteName,
      locale: 'ar_EG',
      type: 'website',
      ...(hasHttpsImage ? { images: [{ url: image }] } : {}),
    },
    twitter: hasHttpsImage
      ? {
          card: 'summary_large_image',
          title,
          description: resolvedDescription,
          images: [image],
        }
      : {
          card: 'summary',
          title,
          description: resolvedDescription,
        },
    robots: {
      index: !noindex,
      follow,
    },
  };
}
