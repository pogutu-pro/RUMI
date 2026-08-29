# RumiaRent RBAC Permission Matrix

Formal resource/action/role/scope definitions for server-side authorization.

| Resource | Action | Role | Scope |
|----------|--------|------|-------|
| Organization | View | super_admin | Platform |
| Organization | View | landlord | Own organization |
| Organization | Edit | landlord | Own organization (owner/admin) |
| Property | View | landlord | Own organization |
| Property | Create | landlord | Own organization |
| Property | Edit | landlord | Own organization |
| Property | View | caretaker | Assigned properties only |
| Property | Edit | caretaker | Assigned properties, if permitted |
| RentalUnit | View | landlord | Own organization |
| RentalUnit | Create | landlord | Own organization |
| RentalUnit | View | caretaker | Assigned properties |
| Tenancy | View | landlord | Own organization |
| Tenancy | Create | landlord, caretaker | Own org / assigned property |
| Tenancy | View | tenant | Own tenancies only |
| TenantProfile | View | landlord | Own organization |
| TenantProfile | Create | landlord, caretaker | Own org / assigned property |
| TenantProfile | View | tenant | Self only |
| TenantProfile | View | caretaker | Assigned properties |
| EmergencyContact | View | landlord | Own organization tenants |
| EmergencyContact | View | caretaker | Assigned property tenants |
| EmergencyContact | View | tenant | Self only |
| EmergencyContact | View | tech_support | **Denied** |
| RentCharge | View | landlord | Own organization |
| RentCharge | View | caretaker | Assigned properties, if permitted |
| RentCharge | View | tenant | Own charges only |
| Payment | View | landlord | Own organization |
| Payment | Record | landlord, caretaker | Own org / assigned, if permitted |
| Payment | View | tenant | Own payments only |
| Payment | View | tech_support | **Denied** |
| Income Report | View | landlord | Own organization |
| Income Report | View | tech_support | **Denied** |
| AuditLog | View | super_admin | Platform |
| AuditLog | View | landlord | Own organization |
| Support Ticket | View | tech_support | Platform support level |

## Implementation

- Permission classes: `core/permissions/rumia.py`
- Queryset scoping: `OrganizationScopedMixin.filter_by_organization()`
- Object-level checks: `CanAccessProperty`, `CanAccessTenantProfile`, `CanViewFinancials`

## Legacy Compatibility

- User.role `student` maps to canonical `tenant` via `get_canonical_role()`
- Existing JWT tokens with `role=student` remain valid during migration
