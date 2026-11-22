// Limits of the API contract (PackageRequestLimits and FileRules in the backend). These checks are a convenience: the
// API stays the judge, and it also checks the real content of the file.
export const AUTHOR_NAME_MAX_LENGTH = 150;
export const WORK_TITLE_MAX_LENGTH = 300;
export const SYNOPSIS_MAX_LENGTH = 2000;
export const NOTES_MAX_LENGTH = 1000;
export const MANUSCRIPT_MAX_BYTES = 25 * 1024 * 1024;
export const MANUSCRIPT_EXTENSIONS: readonly string[] = ['.pdf', '.docx'];
export const MANUSCRIPT_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const MANUSCRIPT_ACCEPT = [...MANUSCRIPT_EXTENSIONS, ...MANUSCRIPT_MIME_TYPES].join(',');

const egyptianMobile = /^(?:0|\+20|0020)1[0125]\d{8}$/;

export type PackageRequestField =
  | 'authorName'
  | 'phone'
  | 'packageId'
  | 'manuscriptTypeId'
  | 'workTitle'
  | 'synopsis'
  | 'notes'
  | 'file';

export type PackageRequestIssue =
  | 'nameRequired'
  | 'nameTooLong'
  | 'phoneInvalid'
  | 'packageRequired'
  | 'typeRequired'
  | 'workTitleRequired'
  | 'workTitleTooLong'
  | 'synopsisRequired'
  | 'synopsisTooLong'
  | 'notesTooLong'
  | 'fileRequired'
  | 'fileType'
  | 'fileSize'
  | 'fileEmpty';

export type PackageRequestFields = {
  authorName: string;
  phone: string;
  packageId: number | null;
  manuscriptTypeId: number | null;
  workTitle: string;
  synopsis: string;
  notes: string;
  file: File | null;
};

export type PackageRequestIssues = Partial<Record<PackageRequestField, PackageRequestIssue>>;

function fileIssue(file: File | null): PackageRequestIssue | undefined {
  if (!file) return 'fileRequired';
  const name = file.name.toLowerCase();
  const hasKnownExtension = MANUSCRIPT_EXTENSIONS.some((extension) => name.endsWith(extension));
  // Some systems leave the type empty, so the extension decides; a wrong non-empty type is refused.
  const hasKnownType = file.type === '' || MANUSCRIPT_MIME_TYPES.includes(file.type);
  if (!hasKnownExtension || !hasKnownType) return 'fileType';
  if (file.size === 0) return 'fileEmpty';
  if (file.size > MANUSCRIPT_MAX_BYTES) return 'fileSize';
  return undefined;
}

export function validatePackageRequest(fields: PackageRequestFields): PackageRequestIssues {
  const issues: PackageRequestIssues = {};
  const name = fields.authorName.trim();
  if (name === '') issues.authorName = 'nameRequired';
  else if (name.length > AUTHOR_NAME_MAX_LENGTH) issues.authorName = 'nameTooLong';
  if (!egyptianMobile.test(fields.phone.replace(/[\s-]/g, ''))) issues.phone = 'phoneInvalid';
  if (fields.packageId === null) issues.packageId = 'packageRequired';
  if (fields.manuscriptTypeId === null) issues.manuscriptTypeId = 'typeRequired';
  const title = fields.workTitle.trim();
  if (title === '') issues.workTitle = 'workTitleRequired';
  else if (title.length > WORK_TITLE_MAX_LENGTH) issues.workTitle = 'workTitleTooLong';
  const synopsis = fields.synopsis.trim();
  if (synopsis === '') issues.synopsis = 'synopsisRequired';
  else if (synopsis.length > SYNOPSIS_MAX_LENGTH) issues.synopsis = 'synopsisTooLong';
  if (fields.notes.trim().length > NOTES_MAX_LENGTH) issues.notes = 'notesTooLong';
  const file = fileIssue(fields.file);
  if (file) issues.file = file;
  return issues;
}
