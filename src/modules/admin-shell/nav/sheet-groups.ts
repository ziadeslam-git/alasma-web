import messages from '@/i18n/messages/ar.json';
import type { IconName } from '@/shared/icons/icon-registry';

import { NAV_GROUPS, SHEET_GROUPS, type NavGroupId, type SheetItemKey } from './nav-config';
import { isCurrentPath, isLinkable, type NavEntry } from './use-admin-nav';

const text = messages.admin.nav;

export type SheetLine = {
  key: SheetItemKey;
  label: string;
  // null = inert "soon": no built page, a locked flag or a design page without its own screen.
  href: string | null;
};

export type SheetEntry = {
  id: NavGroupId;
  label: string;
  icon: IconName;
  isCurrent: boolean;
  lines: SheetLine[];
};

// The phone sheet the way the design lists it. A line is hidden when the user lacks the permission (the real nav item
// is not visible), a live link when its page is built and unlocked, and inert "soon" otherwise.
export function buildSheetEntries(entries: readonly NavEntry[], pathname: string): SheetEntry[] {
  const visible = new Map(
    entries.flatMap((entry) => entry.items.map((item) => [item.item.labelKey, item] as const)),
  );
  const result: SheetEntry[] = [];

  for (const group of SHEET_GROUPS) {
    const icon = NAV_GROUPS.find((entry) => entry.id === group.id)?.icon ?? 'grid';
    const lines: SheetLine[] = [];

    for (const line of group.items) {
      const page = visible.get(line.page);

      if (!page) {
        continue;
      }

      const href = line.soon || !isLinkable(page) ? null : page.item.href;
      lines.push({ href, key: line.key, label: text.sheetItems[line.key] });
    }

    if (lines.length > 0) {
      const isCurrent = lines.some(
        (line) => line.href !== null && isCurrentPath(line.href, pathname),
      );
      result.push({ icon, id: group.id, isCurrent, label: text.groups[group.id], lines });
    }
  }

  return result;
}
