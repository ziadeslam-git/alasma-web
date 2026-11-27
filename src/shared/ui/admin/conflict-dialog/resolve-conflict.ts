// "Keep mine" is NOT a bypass: the user's edit is saved again, with the rowVersion of the record as it is on the
// server NOW. The fresh copy is fetched first, then the save runs normally, so server-side validation and a second
// conflict (someone saved in between) still apply: a failure here is thrown to the caller like any other save error.
export async function keepMineWithFreshVersion<Latest extends { rowVersion: string }>(
  fetchLatest: () => Promise<Latest>,
  saveWithVersion: (rowVersion: string, latest: Latest) => Promise<void>,
): Promise<void> {
  const latest = await fetchLatest();

  await saveWithVersion(latest.rowVersion, latest);
}
