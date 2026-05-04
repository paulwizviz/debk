/** Default books scope (single-business local app). */
export const BUSINESS_ID = 1;

const fetchDefaults = { credentials: 'include' };

export function withBusinessQuery(url) {
  const u = new URL(url, window.location.origin);
  if (!u.searchParams.has('business_id')) {
    u.searchParams.set('business_id', String(BUSINESS_ID));
  }
  return u.pathname + u.search;
}

export async function apiGet(path) {
  const res = await fetch(withBusinessQuery(path), { ...fetchDefaults });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(withBusinessQuery(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    ...fetchDefaults,
  });
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(withBusinessQuery(path), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    ...fetchDefaults,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}
