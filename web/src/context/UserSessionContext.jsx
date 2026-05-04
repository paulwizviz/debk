import React, { createContext, useContext, useMemo } from 'react';
import { hasAnyPerm, hasPerm, P } from '../authz/rolePermissions';

const UserSessionContext = createContext(null);

function rolesCanInviteUsers(roles) {
  if (!roles?.length) return false;
  return roles.some((r) => r === 'admin');
}

function rolesIsAdmin(roles) {
  return roles?.includes('admin') ?? false;
}

/** Current operator from GET /api/auth/me (public shape). */
export function UserSessionProvider({ children, operator }) {
  const value = useMemo(() => {
    const roles = operator?.roles ?? [];
    const portalIdentity = hasAnyPerm(roles, P.userRead, P.userWrite, P.userInvite);
    const portalConfigure = hasPerm(roles, P.coaWrite);
    const portalBooks = hasAnyPerm(roles, P.journalRead, P.journalWrite, P.reportRead);

    return {
      operator,
      roles,
      isAdmin: rolesIsAdmin(roles),
      canInviteUsers: rolesCanInviteUsers(roles),
      hasPerm: (perm) => hasPerm(roles, perm),
      hasAnyPerm: (...perms) => hasAnyPerm(roles, ...perms),
      portalIdentity,
      portalConfigure,
      portalBooks,
      canBusinessWrite: hasPerm(roles, P.businessWrite),
    };
  }, [operator]);

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  return ctx;
}
