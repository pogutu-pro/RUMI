# RUMI Production Readiness Audit Report

**Date:** February 5, 2026  
**Auditor:** Principal Software Engineer / Staff Engineer  
**Scope:** Complete Production Readiness Assessment of Hostel Domain & Connected Flows

## Executive Summary

The RUMI platform demonstrates sophisticated domain modeling but contains **critical production blockers** that prevent safe deployment. The system suffers from fundamental multi-tenant security vulnerabilities, incomplete API contracts, and data integrity risks. While the core architecture is sound, several critical issues must be resolved before production deployment.

**CRITICAL FINDINGS:**
- **IDOR Vulnerabilities:** No systematic tenant isolation enforcement
- **API Contract Mismatches:** Frontend-backend desynchronization on booking references
- **Permission Gaps:** Inconsistent role-based access control implementation
- **Data Integrity Risks:** Missing constraints and validation cascades

---

## 1. CRITICAL PRODUCTION BLOCKERS

### A. Multi-Tenant Security Vulnerability [CRITICAL]
**Issue:** No systematic tenant isolation - landlords can access other landlords' data
**Impact:** Complete breach of multi-tenant security boundaries
**Root Cause:** Manual ownership checks instead of centralized permission enforcement
**Location:** All hostel/room management views
**Concrete Fix:**
```python
# Create base TenantModelViewSet
class TenantModelViewSet(ModelViewSet):
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.queryset.model, 'landlord'):
            return queryset.filter(landlord__user=self.request.user)
        elif hasattr(self.queryset.model, 'hostel'):
            return queryset.filter(hostel__landlord__user=self.request.user)
        return queryset
```

### B. API Contract Desync - Booking References [CRITICAL]
**Issue:** Backend uses `booking_reference` field, frontend expects `reference`
**Impact:** Booking creation and display will fail
**Root Cause:** Inconsistent field naming across layers
**Location:** 
- Backend: `Booking.booking_reference` (models.py line 177)
- Frontend: `Booking.reference` (types.ts line 5)
**Concrete Fix:**
```typescript
// Frontend types.ts
export interface Booking {
  id: string;
  booking_reference: string; // Match backend exactly
  // ... rest of fields
}
```

### C. Missing Permission Class Enforcement [HIGH]
**Issue:** `IsHostelOwner` and `IsLandlordOfRoom` permissions exist but aren't used
**Impact:** Potential unauthorized access to resources
**Root Cause:** Permission classes defined but not applied to ViewSets
**Location:** permissions.py lines 104-135
**Concrete Fix:**
```python
class HostelViewSet(TenantModelViewSet):
    permission_classes = [IsAuthenticated, IsVerifiedLandlord, IsHostelOwner]
    # ... implementation
```

---

## 2. DATA INTEGRITY RISKS

### A. Missing Foreign Key Constraints [HIGH]
**Issue:** Caretaker-hostel assignment lacks proper cascade handling
**Impact:** Orphaned caretaker records when hostels are deleted
**Root Cause:** CaretakerProfile.hostel relationship not properly constrained
**Concrete Fix:**
```python
class CaretakerProfile(models.Model):
    hostel = models.ForeignKey(
        Hostel, 
        on_delete=models.CASCADE,  # Change from PROTECT
        related_name='caretakers'
    )
```

### B. Inconsistent Status Field Usage [MEDIUM]
**Issue:** Mixed use of `status` vs `is_active` across models
**Impact:** Confusing business logic and potential data inconsistency
**Root Cause:** No standardized status field pattern
**Concrete Fix:** Standardize on `status` field with proper choices for all models

### C. Missing Unique Constraints [MEDIUM]
**Issue:** Room numbers unique per hostel but no constraint on booking references
**Impact:** Potential duplicate booking references
**Concrete Fix:** Add `unique=True` to `booking_reference` field

---

## 3. END-TO-END FLOW VALIDATION

| Flow Step | Status | Critical Issue |
| :--- | :--- | :--- |
| Public User → Browse Hostels | ✅ OPERATIONAL | None |
| Landlord → Create Hostel | ✅ OPERATIONAL | None |
| Landlord → Add Rooms | ✅ OPERATIONAL | None |
| Landlord → Invite Caretaker | 🔴 BROKEN | Bypasses verification check |
| Student → Apply/Book | 🔴 BROKEN | API contract mismatch on reference field |
| Caretaker → Accept Student | ⚠️ AT RISK | Missing permission enforcement |
| Multi-Hostel Management | 🔴 BROKEN | No tenant isolation |

---

## 4. SECURITY RISKS ASSESSMENT

### A. Insecure Direct Object Reference (IDOR) [CRITICAL]
**Risk:** Any authenticated landlord can access any hostel/room by ID
**Examples:**
- `GET /api/hostels/123/` - No ownership check
- `POST /api/hostels/123/rooms/` - Manual check only
**Fix Required:** Centralized tenant filtering in all ViewSets

### B. Permission Bypass [HIGH]
**Risk:** Caretaker invitation bypasses landlord verification
**Location:** Caretaker invitation flow
**Fix Required:** Add `IsVerifiedLandlord` permission to caretaker endpoints

### C. Data Leakage [MEDIUM]
**Risk:** Landlord stats visible across tenant boundaries
**Fix Required:** Scope all queries to authenticated user's context

---

## 5. FRONTEND-BACKEND CONTRACT ISSUES

### A. Field Name Mismatches [HIGH]
```python
# Backend Model
class Booking:
    booking_reference = models.CharField(max_length=100, unique=True)

# Frontend Type  
interface Booking {
    reference?: string;  # WRONG - should be booking_reference
}
```

### B. Type Inconsistencies [MEDIUM]
- Backend: `base_price` as `DecimalField`
- Frontend: `base_price` as `string` (correct)
- Issue: Some frontend types use `number` for monetary values

### C. Missing Response Fields [MEDIUM]
**Issue:** Frontend expects `landlord_phone` but backend provides `landlord_info.phone`
**Fix Required:** Align serializer output with frontend expectations

---

## 6. DOMAIN DESIGN IMPROVEMENTS

### A. Event-Driven Consistency [RECOMMENDED]
**Issue:** Manual stats updates (total_rooms, available_rooms)
**Risk:** Race conditions and data inconsistency
**Fix:** Use Django signals or computed properties

### B. Audit Trail Enhancement [RECOMMENDED]
**Issue:** `UserActivityLog` exists but not integrated
**Fix:** Add automatic logging to all critical operations

### C. Soft Delete Implementation [RECOMMENDED]
**Current:** `SoftDeleteModel` exists but not consistently used
**Fix:** Apply soft deletes to all tenant-critical models

---

## 7. PRODUCTION DEPLOYMENT CHECKLIST

### MUST FIX BEFORE PRODUCTION:
- [ ] Implement `TenantModelViewSet` for all tenant-scoped resources
- [ ] Fix booking reference field naming consistency
- [ ] Apply existing permission classes to all ViewSets
- [ ] Add proper foreign key constraints for caretaker-hostel relationships
- [ ] Implement systematic tenant isolation in all queries

### SHOULD FIX BEFORE PRODUCTION:
- [ ] Standardize status field patterns across all models
- [ ] Add unique constraints to prevent data duplication
- [ ] Integrate audit logging for critical operations
- [ ] Implement comprehensive API contract testing

### NICE TO HAVE:
- [ ] Event-driven stats updates
- [ ] Advanced audit trail with user action tracking
- [ ] Automated consistency checks and repairs

---

## Final Verdict

**Current State:** NOT PRODUCTION READY

The RUMI platform requires **critical security fixes** before any production deployment. The multi-tenant isolation vulnerabilities and API contract mismatches represent significant risks to data security and system reliability.

---

## 8. PHASE-BY-PHASE REMEDIATION PLAN

### Phase 1: Security & Multi-Tenant Hardening (The Foundation)
**Goal:** Seal all data leakage paths and enforce RBAC.
- [ ] Implement `TenantModelViewSet` as the base for all tenant-aware resources.
- [ ] Refactor `HostelViewSet`, `RoomViewSet`, and `BookingViewSet` to inherit from `TenantModelViewSet`.
- [ ] Apply `IsHostelOwner`, `IsLandlordOfRoom`, and `IsVerifiedLandlord` permissions systemically.
- [ ] Centralize authorization logic to prevent IDOR vulnerabilities.

### Phase 2: Domain Integrity & Logic Fixes (The Business Logic)
**Goal:** Ensure data consistency and fix broken backend flows.
- [ ] Standardize `status` field usage across all models (Hostel, Room, Booking).
- [ ] Implement proper cascading and foreign key constraints (Caretaker-Hostel relationship).
- [ ] Add unique constraints (e.g., `booking_reference`).
- [ ] Resolve "Invite Caretaker" flow verification bypass.

### Phase 3: E2E Flow Validation & Contract Alignment (The User Experience)
**Goal:** Align frontend with backend and fix full user journeys.
- [ ] Fix `booking_reference` vs `reference` mismatch in frontend types and API calls.
- [ ] Align serializer outputs with frontend expectations (e.g., `landlord_phone`).
- [ ] Validate "Student Apply" and "Caretaker Accept" flows end-to-end.
- [ ] Hardened multi-hostel management UI to ensure no context leakage.

### Phase 4: Production Compliance & Quality Assurance (Final Polish)
**Goal:** Audit logging, soft deletes, and final verification.
- [ ] Systematically apply `SoftDeleteModel` to all critical entities.
- [ ] Integrate `UserActivityLog` for all sensitive landlord/caretaker actions.
- [ ] Run final automated test suite and manual verification of all happy paths.
- [ ] Final sign-off on the Production Readiness Checklist.

---

## 9. PRIORITY ORDER & ESTIMATION

1. **Multi-tenant security** (High Impact, High Risk) - *Immediate*
2. **API contract alignment** (Blocking Student Flow) - *High Priority*
3. **Permission class enforcement** - *High Priority*
4. **Data integrity constraints** - *Medium Priority*
5. **Audit and monitoring enhancements** - *Medium Priority*

**Estimated Fix Time:** 2-3 weeks for critical issues
**Risk Level:** HIGH - Multiple security vulnerabilities
**Recommendation:** Address Phase 1 and Phase 2 immediately.
