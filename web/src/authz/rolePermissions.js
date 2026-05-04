/**
 * Mirrors internal/authz/authz.go rolePermissions — keep in sync when backend roles change.
 */
export const P = {
  businessRead: 'business:read',
  businessWrite: 'business:write',
  coaRead: 'coa:read',
  coaWrite: 'coa:write',
  journalRead: 'journal:read',
  journalWrite: 'journal:write',
  periodRead: 'period:read',
  periodWrite: 'period:write',
  reportRead: 'report:read',
  userRead: 'user:read',
  userWrite: 'user:write',
  userInvite: 'user:invite',
};

const ROLE_PERMS = {
  full_admin: [
    P.businessRead,
    P.businessWrite,
    P.coaRead,
    P.coaWrite,
    P.journalRead,
    P.journalWrite,
    P.periodRead,
    P.periodWrite,
    P.reportRead,
    P.userRead,
    P.userWrite,
    P.userInvite,
  ],
  configure: [
    P.businessRead,
    P.businessWrite,
    P.coaRead,
    P.coaWrite,
    P.journalRead,
    P.journalWrite,
    P.periodRead,
    P.periodWrite,
    P.reportRead,
    P.userRead,
    P.userInvite,
  ],
  bookkeep: [
    P.businessRead,
    P.coaRead,
    P.journalRead,
    P.journalWrite,
    P.periodRead,
    P.periodWrite,
    P.reportRead,
  ],
};

export function hasPerm(roles, perm) {
  if (!roles?.length) return false;
  for (const r of roles) {
    const list = ROLE_PERMS[r];
    if (!list) continue;
    if (list.includes(perm)) return true;
  }
  return false;
}

export function hasAnyPerm(roles, ...perms) {
  if (!perms.length) return false;
  return perms.some((p) => hasPerm(roles, p));
}
