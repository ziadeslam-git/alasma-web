import type { AuthorOption, CategoryNode, FilterOptions, PublisherOption } from '../types';

export type SelectOption = {
  value: string;
  label: string;
  // The API also accepts the numeric id, so a URL carrying the id still selects the option.
  aliases?: readonly string[];
  depth?: number;
};

// The category tree as one flat list in display order, with the nesting depth.
export function flattenCategories(nodes: readonly CategoryNode[], depth = 0): SelectOption[] {
  return nodes.flatMap((node) => [
    { value: node.slug, label: node.name, aliases: [String(node.id)], depth },
    ...flattenCategories(node.children, depth + 1),
  ]);
}

export const toAuthorOption = (author: AuthorOption): SelectOption => ({
  value: author.slug,
  label: author.name,
  aliases: [String(author.id)],
});

export const toPublisherOption = (publisher: PublisherOption): SelectOption => ({
  value: publisher.slug,
  label: publisher.name,
  aliases: [String(publisher.id)],
});

export function matchesOption(option: SelectOption, value: string | undefined): boolean {
  return (
    value !== undefined && (option.value === value || (option.aliases?.includes(value) ?? false))
  );
}

// Chip labels come from the option lists. A value that is not in a list (for example an author beyond the first
// page of authors) falls back to the raw value rather than showing nothing.
export function findOptionLabel(options: readonly SelectOption[], value: string): string {
  return options.find((option) => matchesOption(option, value))?.label ?? value;
}

export function buildSelectOptions(options: FilterOptions) {
  return {
    categories: flattenCategories(options.categories),
    authors: options.authors.map(toAuthorOption),
    publishers: options.publishers.map(toPublisherOption),
  };
}
