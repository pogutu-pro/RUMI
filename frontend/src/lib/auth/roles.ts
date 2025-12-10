import { UserRole } from '@/types/auth.types';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.CARETAKER]: 2,
  [UserRole.LANDLORD]: 3,
  [UserRole.TECH_SUPPORT_ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};

export function isRoleHigherThan(
  role: UserRole,
  comparisonRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[comparisonRole];
}

export function isRoleEqualOrHigherThan(
  role: UserRole,
  comparisonRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[comparisonRole];
}

export function getRoleDisplayName(role: UserRole): string {
  const DISPLAY_NAMES: Record<UserRole, string> = {
    [UserRole.STUDENT]: 'Student',
    [UserRole.LANDLORD]: 'Landlord',
    [UserRole.CARETAKER]: 'Caretaker',
    [UserRole.TECH_SUPPORT_ADMIN]: 'Tech Support Admin',
    [UserRole.SUPER_ADMIN]: 'Super Admin',
  };
  return DISPLAY_NAMES[role];
}

export function getRoleDescription(role: UserRole): string {
  const DESCRIPTIONS: Record<UserRole, string> = {
    [UserRole.STUDENT]: 'Students looking for accommodation',
    [UserRole.LANDLORD]: 'Property owners listing hostels',
    [UserRole.CARETAKER]: 'On-site property managers',
    [UserRole.TECH_SUPPORT_ADMIN]: 'Platform support and moderation',
    [UserRole.SUPER_ADMIN]: 'Full platform administration',
  };
  return DESCRIPTIONS[role];
}

export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (managerRole === UserRole.SUPER_ADMIN) return true;
  if (managerRole === UserRole.TECH_SUPPORT_ADMIN) {
    const manageableRoles: UserRole[] = [
      UserRole.STUDENT,
      UserRole.CARETAKER,
      UserRole.LANDLORD,
    ];
    return manageableRoles.includes(targetRole);
  }
  if (managerRole === UserRole.LANDLORD) {
    return targetRole === UserRole.CARETAKER;
  }
  return false;
}

export function getRoleDefaultPath(role: UserRole): string {
  const DEFAULT_PATHS: Record<UserRole, string> = {
    [UserRole.STUDENT]: '/student/dashboard',
    [UserRole.LANDLORD]: '/landlord/dashboard',
    [UserRole.CARETAKER]: '/caretaker/dashboard',
    [UserRole.TECH_SUPPORT_ADMIN]: '/admin/dashboard',
    [UserRole.SUPER_ADMIN]: '/admin/dashboard',
  };
  return DEFAULT_PATHS[role];
}
