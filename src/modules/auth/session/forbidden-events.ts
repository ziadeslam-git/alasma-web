type ForbiddenListener = () => void;

// A 403 from the API on a signed-in request that is about a missing permission (not an unconfirmed email). The admin
// area listens: it tells the user and loads /me again, because the permissions may have changed since sign-in.
const listeners = new Set<ForbiddenListener>();

export function subscribeForbidden(listener: ForbiddenListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyForbidden() {
  for (const listener of [...listeners]) {
    listener();
  }
}
