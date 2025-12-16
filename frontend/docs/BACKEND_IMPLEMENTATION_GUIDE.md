# Backend Implementation Guide for Role-Based Dashboards

**Document Purpose:** Action-oriented implementation guide for backend engineers  
**Last Updated:** 2025-12-16  
**Frontend Reference:** This document is based on actual frontend implementation after mock data removal

---

## 📋 Table of Contents

1. [Critical Actions Required](#critical-actions-required)
2. [Endpoints by Role-Based Dashboard](#endpoints-by-role-based-dashboard)
3. [Implementation Specifications](#implementation-specifications)
4. [Consolidation & Cleanup Tasks](#consolidation--cleanup-tasks)
5. [Testing Requirements](#testing-requirements)

---

## 🚨 Critical Actions Required

### Priority 1: Namespace Consolidation

**⚠️ BREAKING CHANGE REQUIRED**

You currently have **duplicate namespaces** that must be consolidated:

```
REMOVE: /caretaker-operations/*
KEEP:   /caretaker/*
```

**Action Steps:**
1. Migrate all `/caretaker-operations/*` endpoint logic to `/caretaker/*`
2. Ensure all caretaker-related operations use single namespace
3. Update API documentation to reflect consolidation
4. Deprecate old endpoints with 301 redirects (if versioning allows)

**Affected Endpoints:** All check-in, check-out, damage reports, dashboard, inventory, maintenance, notifications, students, tasks, and visitors endpoints.

---

## 📊 Endpoints by Role-Based Dashboard

### 1. ADMIN DASHBOARD

#### Missing Endpoints

##### `GET /admin/admin/activity-feed/`
**Status:** ✅ Already Implemented  
**Used in:** Admin Dashboard Recent Activity section

##### `GET /admin/admin/dashboard/stats/`
**Status:** ✅ Already Implemented  
**Used in:** Admin Dashboard KPI cards

**Required Response Structure:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalHostels": 45,
    "totalBookings": 890,
    "revenue": 125000.50,
    "activeStudents": 678,
    "occupancyRate": 87.5,
    "pendingVerifications": 12,
    "activeDisputes": 3
  }
}
```

##### `GET /analytics/distribution/users/`
**Status:** ⚠️ MISSING - REQUIRED  
**Purpose:** User distribution by role for analytics  
**Used in:** Admin Dashboard analytics section

**Implementation:**
```python
# Django Example
@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_distribution(request):
    """Get user distribution by role"""
    distribution = User.objects.values('role').annotate(
        count=Count('id'),
        active_count=Count('id', filter=Q(is_active=True)),
        percentage=ExpressionWrapper(
            Count('id') * 100.0 / User.objects.count(),
            output_field=FloatField()
        )
    )
    
    return Response({
        "success": True,
        "data": {
            "by_role": list(distribution),
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count()
        }
    })
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "by_role": [
      {"role": "student", "count": 850, "active_count": 820, "percentage": 68.0},
      {"role": "landlord", "count": 120, "active_count": 115, "percentage": 9.6},
      {"role": "caretaker", "count": 45, "active_count": 43, "percentage": 3.6},
      {"role": "admin", "count": 5, "active_count": 5, "percentage": 0.4}
    ],
    "total_users": 1020,
    "active_users": 983
  }
}
```

---

### 2. STUDENT DASHBOARD

#### Missing Endpoints

##### `GET /accounts/dashboard/`
**Status:** ✅ Already Implemented  
**Used in:** Main student dashboard data aggregation

**IMPORTANT - Response Must Include:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "hostel": {
        "id": "uuid",
        "name": "Campus View Hostel",
        "address": "123 University Ave"
      },
      "room": {
        "id": "uuid",
        "number": "A-204",
        "type": "shared"
      },
      "start_date": "2024-01-15",
      "end_date": "2024-12-15",
      "duration_months": 11,
      "status": "active"
    },
    "rent_status": {
      "next_due_date": "2024-02-01",
      "amount_due": 15000.00,
      "is_overdue": false,
      "days_until_due": 5
    },
    "roommates": [
      {
        "id": "uuid",
        "name": "John Doe",
        "profile_picture": "url",
        "compatibility_score": 85
      }
    ],
    "recent_transactions": [
      {
        "id": "uuid",
        "amount": 15000.00,
        "date": "2024-01-01",
        "status": "completed",
        "type": "rent_payment"
      }
    ],
    "unread_messages": 3,
    "pending_requests": 1
  }
}
```

##### `GET /messages/unread-count/`
**Status:** ⚠️ MISSING - REQUIRED  
**Purpose:** Quick unread message counter for dashboard

**Implementation:**
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_message_count(request):
    """Get unread message count for current user"""
    count = Message.objects.filter(
        conversation__participants=request.user,
        is_read=False,
        sender__ne=request.user.id  # Not sent by current user
    ).count()
    
    return Response({
        "success": True,
        "data": {
            "unread_count": count
        }
    })
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

##### `GET /activity/feed/` OR Use `/admin/admin/activity-feed/`
**Status:** ⚠️ NEEDS CLARIFICATION  
**Current:** Frontend uses `/admin/admin/activity-feed/` which may be admin-only  
**Required:** Student-specific activity feed

**Recommendation:** Create role-based activity feed:
```
GET /activity/feed/  - Returns activity based on user role
```

---

### 3. LANDLORD DASHBOARD

#### Missing Endpoints

##### `GET /landlord/dashboard/overview/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Landlord dashboard overview with KPIs and growth metrics  
**Used in:** Landlord Dashboard main page

**CRITICAL REQUIREMENT:** Must include growth trends/percentages

**Implementation:**
```python
@api_view(['GET'])
@permission_classes([IsLandlord])
def landlord_dashboard_overview(request):
    """Get comprehensive landlord dashboard data with growth metrics"""
    landlord = request.user.landlord_profile
    
    # Current period stats
    current_revenue = calculate_current_revenue(landlord)
    current_occupancy = calculate_occupancy_rate(landlord)
    
    # Previous period for growth calculation
    previous_revenue = calculate_previous_revenue(landlord)
    previous_occupancy = calculate_previous_occupancy(landlord)
    
    # Calculate growth percentages
    revenue_growth = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
    occupancy_growth = current_occupancy - previous_occupancy
    
    return Response({
        "success": True,
        "data": {
            "revenue": {
                "current": current_revenue,
                "previous": previous_revenue,
                "growth_percentage": revenue_growth,
                "trend": "up" if revenue_growth > 0 else "down"
            },
            "occupancy": {
                "current": current_occupancy,
                "previous": previous_occupancy,
                "growth_percentage": occupancy_growth,
                "trend": "up" if occupancy_growth > 0 else "down"
            },
            "total_hostels": landlord.hostels.count(),
            "total_rooms": Room.objects.filter(hostel__landlord=landlord).count(),
            "occupied_rooms": Room.objects.filter(
                hostel__landlord=landlord,
                current_booking__isnull=False
            ).count(),
            "pending_bookings": Booking.objects.filter(
                room__hostel__landlord=landlord,
                status='pending'
            ).count(),
            "maintenance_requests": MaintenanceRequest.objects.filter(
                room__hostel__landlord=landlord,
                status='pending'
            ).count()
        }
    })
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "current": 125000.00,
      "previous": 110000.00,
      "growth_percentage": 13.64,
      "trend": "up"
    },
    "occupancy": {
      "current": 87.5,
      "previous": 82.0,
      "growth_percentage": 5.5,
      "trend": "up"
    },
    "total_hostels": 5,
    "total_rooms": 120,
    "occupied_rooms": 105,
    "pending_bookings": 8,
    "maintenance_requests": 3
  }
}
```

##### Landlord Caretaker Management
**Status:** ⚠️ ALL MISSING - CRITICAL

These endpoints are **actively used** but not in SETUP_GUIDE.md:

###### `GET /landlord/caretakers/`
**Purpose:** List all caretakers for this landlord  
**Permissions:** Landlord only, filtered to their hostels

```python
@api_view(['GET'])
@permission_classes([IsLandlord])
def list_caretakers(request):
    """List caretakers assigned to landlord's hostels"""
    landlord = request.user.landlord_profile
    caretakers = Caretaker.objects.filter(
        hostel__landlord=landlord
    ).select_related('user', 'hostel').distinct()
    
    serializer = CaretakerSerializer(caretakers, many=True)
    return Response({
        "success": True,
        "data": serializer.data
    })
```

###### `POST /landlord/caretakers/`
**Purpose:** Assign/create caretaker for a hostel

```python
@api_view(['POST'])
@permission_classes([IsLandlord])
def create_caretaker_assignment(request):
    """Assign a caretaker to a hostel"""
    landlord = request.user.landlord_profile
    hostel_id = request.data.get('hostel_id')
    
    # Verify landlord owns this hostel
    hostel = get_object_or_404(
        Hostel,
        id=hostel_id,
        landlord=landlord
    )
    
    # Create or assign caretaker
    serializer = CaretakerAssignmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(hostel=hostel)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=201)
    
    return Response({
        "success": False,
        "errors": serializer.errors
    }, status=400)
```

**Request Body:**
```json
{
  "hostel_id": "uuid",
  "user_id": "uuid",  // Existing user to promote to caretaker
  "email": "email@example.com",  // OR invite new user
  "name": "John Doe",
  "phone": "+254712345678"
}
```

###### `GET /landlord/caretakers/{id}/`
**Purpose:** Get specific caretaker details

###### `PATCH /landlord/caretakers/{id}/`
**Purpose:** Update caretaker assignment

###### `DELETE /landlord/caretakers/{id}/`
**Purpose:** Remove caretaker from hostel

---

### 4. CARETAKER DASHBOARD

> [!WARNING]
> **CRITICAL: Namespace Consolidation Required**
> 
> SETUP_GUIDE.md contains **DUPLICATE NAMESPACES**:
> - `/caretaker-operations/*` (REMOVE - deprecated)  
> - `/caretaker/*` (KEEP - standard namespace)
> 
> Backend must consolidate ALL caretaker endpoints under `/caretaker/*` namespace only.

> [!IMPORTANT]
> **Frontend Analysis Summary**
> 
> The frontend actively uses **53 caretaker endpoints** across 11 feature categories. SETUP_GUIDE.md only documents 21 endpoints, leaving **32 endpoints missing**.

---

#### Complete Caretaker Endpoint Requirements

##### 1. Dashboard

###### `GET /caretaker/dashboard/`
**Status:** ✅ Already in SETUP_GUIDE.md  
**Purpose:** Get caretaker dashboard overview with today's stats, maintenance summary, room occupancy, upcoming events, and recent activity

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "todayOverview": {
      "checkInsToday": 3,
      "checkOutsToday": 1,
      "pendingApprovals": 5,
      "unresolvedIssues": 2,
      "lowAvailabilityRooms": 1,
      "overduePaymentsCount": 4
    },
    "maintenanceStats": {
      "open": 8,
      "inProgress": 3,
      "resolved": 45,
      "highPriority": 2
    },
    "roomOccupancy": {
      "total": 120,
      "occupied": 105,
      "available": 12,
      "underMaintenance": 3,
      "occupancyRate": 87.5
    },
    "upcomingEvents": [],
    "recentActivity": []
  }
}
```

---

##### 2. Tenant (Student) Management

> [!NOTE]
> SETUP_GUIDE.md uses `/caretaker/students/` but frontend uses `/caretaker/tenants/`. Recommend standardizing to `/caretaker/tenants/` for clarity.

###### `GET /caretaker/tenants/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md (listed as `/caretaker/students/`)  
**Purpose:** List all students/tenants in caretaker's hostel with filters

**Query Parameters:**
- `search` - Search by name, email, student ID
- `paymentStatus` - Filter: paid, pending, overdue, all
- `roomNumber` - Filter by room
- `status` - Filter: active, checked_out, suspended, all

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "studentId": "STU12345",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "phone": "+254712345678",
      "profileImage": "url",
      "roomId": "uuid",
      "roomNumber": "A-204",
      "bedNumber": "2",
      "checkInDate": "2024-01-15",
      "checkOutDate": "2024-12-15",
      "paymentStatus": "paid",
      "lastPaymentDate": "2024-01-01",
      "university": "University of Nairobi",
      "course": "Computer Science",
      "yearOfStudy": 3,
      "status": "active"
    }
  ]
}
```

###### `GET /caretaker/tenants/{id}/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Get detailed information for specific tenant

###### `PATCH /caretaker/tenants/{id}/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Update tenant information (emergency contact, notes, etc.)

---

##### 3. Roommate Management

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**
> 
> 7 roommate management endpoints are actively used but completely undocumented.

###### `GET /caretaker/roommates/groups/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List all roommate groups (shared rooms with occupants)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "roomId": "uuid",
      "roomNumber": "A-204",
      "tenants": [
        {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Doe",
          "profileImage": "url"
        }
      ],
      "compatibility": {
        "overall": 85,
        "lifestyle": 90,
        "studyHabits": 80,
        "cleanliness": 85
      },
      "issues": []
    }
  ]
}
```

###### `GET /caretaker/roommates/groups/{roomId}/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get specific room's roommate group details

###### `GET /caretaker/roommates/match-requests/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get pending roommate matching requests

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "studentName": "John Smith",
      "preferredRoommateId": "uuid",
      "preferredRoommateName": "Mike Johnson",
      "preferences": {
        "gender": "male",
        "smoking": false,
        "cleanliness": "very_clean",
        "studyHabits": "quiet"
      },
      "status": "pending",
      "suggestedMatches": [],
      "createdAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

###### `POST /caretaker/roommates/match-requests/{requestId}/approve/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Approve roommate matching request

**Request Body:**
```json
{
  "roomId": "uuid",
  "studentId": "uuid",
  "roommateIds": ["uuid1", "uuid2"],
  "assignedDate": "2024-02-01",
  "notes": "Compatible study habits"
}
```

###### `POST /caretaker/roommates/match-requests/{requestId}/reject/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Reject roommate matching request

**Request Body:**
```json
{
  "reason": "Incompatible schedules"
}
```

###### `POST /caretaker/roommates/assign/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Manually assign students as roommates

**Request Body:**
```json
{
  "roomId": "uuid",
  "studentIds": ["uuid1", "uuid2", "uuid3"],
  "assignedDate": "2024-02-01",
  "notes": "Manual assignment - emergency"
}
```

###### `PATCH /caretaker/roommates/groups/{roomId}/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Update roommate group (swap members, update compatibility notes)

---

##### 4. Check-In Process

###### `POST /caretaker/check-in/verify/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Verify booking code before check-in

**Request Body:**
```json
{
  "code": "BOOK-12345"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "booking": {
      "id": "uuid",
      "studentName": "Jane Doe",
      "roomNumber": "A-204",
      "bedNumber": "2",
      "checkInDate": "2024-02-01"
    }
  }
}
```

###### `POST /caretaker/check-in/`
**Status:** ✅ Already in SETUP_GUIDE.md  
**Purpose:** Process student check-in

**Request Body:**
```json
{
  "tenantId": "uuid",
  "bookingCode": "BOOK-12345",
  "roomId": "uuid",
  "bedNumber": "2",
  "actualCheckInDate": "2024-02-01T10:30:00Z",
  "identityVerified": true,
  "bookingVerified": true,
  "photoProof": ["url1", "url2"],
  "notes": "All documents verified",
  "processedBy": "uuid",
  "processedAt": "2024-02-01T10:30:00Z"
}
```

###### `POST /caretaker/check-in/photos/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Upload check-in verification photos

**Request:** Multipart form data with photo files

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "urls": ["https://cdn.example.com/photo1.jpg"]
  }
}
```

###### `GET /caretaker/check-in/`
**Status:** ✅ Already in SETUP_GUIDE.md  
**Purpose:** List recent/scheduled check-ins

---

##### 5. Check-Out Process

###### `POST /caretaker/check-out/`
**Status:** ✅ Already in SETUP_GUIDE.md  
**Purpose:** Process student check-out

**Request Body:**
```json
{
  "tenantId": "uuid",
  "roomId": "uuid",
  "actualCheckOutDate": "2024-12-15T14:00:00Z",
  "reason": "semester_end",
  "reasonDetails": "Completed academic year",
  "roomCondition": "clean",
  "damages": [
    {
      "item": "Window glass",
      "description": "Cracked corner",
      "severity": "minor",
      "estimatedCost": 2000
    }
  ],
  "photoProof": ["url1", "url2"],
  "notes": "Room in good condition",
  "processedBy": "uuid",
  "processedAt": "2024-12-15T14:00:00Z"
}
```

###### `POST /caretaker/check-out/photos/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Upload check-out inspection photos

---

##### 6. Room Management

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**
> 
> 7 room management endpoints are actively used but completely undocumented.

###### `GET /caretaker/rooms/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List all rooms with current status

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "number": "A-204",
      "type": "shared",
      "capacity": 3,
      "currentOccupancy": 2,
      "status": "occupied",
      "floor": 2,
      "condition": "good",
      "lastInspection": "2024-01-20",
      "maintenanceStatus": "none",
      "notes": "AC needs servicing soon"
    }
  ]
}
```

###### `GET /caretaker/rooms/{id}/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get detailed room status and occupant info

###### `POST /caretaker/rooms/assign/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Assign student to specific room/bed

**Request Body:**
```json
{
  "studentId": "uuid",
  "roomId": "uuid",
  "bedNumber": "2",
  "assignedDate": "2024-02-01",
  "moveInDate": "2024-02-01",
  "notes": "Preferred ground floor"
}
```

###### `POST /caretaker/rooms/change-request/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Request room change for student

**Request Body:**
```json
{
  "studentId": "uuid",
  "currentRoomId": "uuid",
  "requestedRoomId": "uuid",
  "reason": "Medical condition requires ground floor",
  "priority": "high",
  "requestedBy": "uuid"
}
```

###### `POST /caretaker/rooms/{roomId}/maintenance/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Mark room as under maintenance

**Request Body:**
```json
{
  "reason": "Plumbing repair needed",
  "expectedEndDate": "2024-02-05"
}
```

###### `DELETE /caretaker/rooms/{roomId}/maintenance/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Clear room maintenance status (mark as available)

###### `PATCH /caretaker/rooms/{roomId}/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Update room notes/information

**Request Body:**
```json
{
  "notes": "AC serviced on 2024-02-01"
}
```

---

##### 7. Maintenance Management

###### `GET /caretaker/maintenance/`
**Status:** ✅ Already in SETUP_GUIDE.md  
**Purpose:** List maintenance requests with filters

**Query Parameters:**
- `status` - Filter: pending, in_progress, resolved, all
- `priority` - Filter: low, medium, high, urgent
- `category` - Filter by maintenance type
- `dateFrom`, `dateTo` - Date range filters

###### `GET /caretaker/maintenance/{id}/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Get specific maintenance request details

###### `POST /caretaker/maintenance/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Create new maintenance request

**Request Body:**
```json
{
  "roomId": "uuid",
  "category": "plumbing",
  "title": "Leaking faucet",
  "description": "Bathroom sink faucet dripping continuously",
  "priority": "medium",
  "reportedBy": "uuid",
  "photoUrls": ["url1", "url2"]
}
```

###### `POST /caretaker/maintenance/{id}/update/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md (SETUP_GUIDE has PUT but frontend uses POST)  
**Purpose:** Update maintenance request status

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Plumber scheduled for tomorrow",
  "updatedBy": "uuid",
  "photoUrls": []
}
```

###### `POST /caretaker/maintenance/photos/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Upload maintenance request photos

###### `POST /caretaker/maintenance/{id}/notify-landlord/`
**Status:** ⚠️ MISSING from SETUP_GUIDE.md  
**Purpose:** Send notification to landlord about maintenance issue

---

##### 8. Security Monitoring

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**
> 
> 7 security monitoring endpoints are actively used but completely undocumented.

###### `GET /caretaker/security/visitors/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get visitor logs with filters

**Query Parameters:**
- `dateFrom`, `dateTo` - Date range
- `studentId` - Filter by student
- `status` - Filter: checked_in, checked_out

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "visitorName": "John Smith",
      "visitorIdNumber": "12345678",
      "studentId": "uuid",
      "studentName": "Jane Doe",
      "roomNumber": "A-204",
      "purpose": "Family visit",
      "timeIn": "2024-02-01T14:00:00Z",
      "timeOut": "2024-02-01T18:00:00Z",
      "loggedBy": "uuid",
      "loggedByName": "Caretaker Name"
    }
  ]
}
```

###### `POST /caretaker/security/visitors/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Create visitor log entry

###### `PATCH /caretaker/security/visitors/{id}/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Update visitor log (mark checkout time)

###### `GET /caretaker/security/night-checks/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get night check reports

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "checkDate": "2024-02-01",
      "checkTime": "22:00:00",
      "totalRoomsChecked": 45,
      "issuesFound": 2,
      "notes": "All quiet, 2 rooms had noise after curfew",
      "performedBy": "uuid",
      "performedByName": "Caretaker Name"
    }
  ]
}
```

###### `POST /caretaker/security/night-checks/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Create night check report

###### `GET /caretaker/security/late-entries/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get late entry logs (students entering after curfew)

###### `POST /caretaker/security/late-entries/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Log student late entry

**Request Body:**
```json
{
  "studentId": "uuid",
  "entryTime": "2024-02-01T01:30:00Z",
  "reason": "Late from library",
  "verified": true
}
```

---

##### 9. Visitor Invitation Workflow

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**
> 
> SETUP_GUIDE.md has generic `/caretaker/visitors/` endpoints, but frontend uses a complete invitation workflow system with 5 different endpoints.

###### `GET /caretaker/visitor-invitations/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List visitor invitation requests from students

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "visitorName": "John Smith",
      "visitorPhone": "+254712345678",
      "visitorIdNumber": "12345678",
      "studentId": "uuid",
      "studentName": "Jane Doe",
      "roomNumber": "A-204",
      "purpose": "Family visit",
      "expectedArrivalTime": "2024-02-01T14:00:00Z",
      "status": "pending",
      "createdAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

###### `POST /caretaker/visitor-invitations/{id}/approve/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Approve student's visitor invitation request

###### `POST /caretaker/visitor-invitations/{id}/reject/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Reject visitor invitation with reason

**Request Body:**
```json
{
  "reason": "Invalid ID documentation"
}
```

###### `POST /caretaker/visitor-invitations/{id}/check-in/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Check in approved visitor upon arrival

**Request Body:**
```json
{
  "timeIn": "2024-02-01T14:05:00Z"
}
```

###### `POST /caretaker/visitor-invitations/{id}/check-out/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Check out visitor when leaving

**Request Body:**
```json
{
  "timeOut": "2024-02-01T18:00:00Z"
}
```

---

##### 10. Roommate Request Workflow

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**

###### `GET /caretaker/roommate-requests/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List roommate pairing/matching requests from students

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requesterId": "uuid",
      "requesterName": "John Doe",
      "requesterRoom": "A-101",
      "requesteeId": "uuid",
      "requesteeName": "Mike Smith",
      "requesteeRoom": "A-102",
      "matchScore": 85,
      "status": "pending",
      "requestReason": "Compatible study schedules",
      "preferences": {
        "studyHabits": "quiet",
        "sleepSchedule": "early"
      },
      "createdAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

###### `POST /caretaker/roommate-requests/{id}/approve/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Approve roommate matching request

###### `POST /caretaker/roommate-requests/{id}/reject/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Reject roommate request

**Request Body:**
```json
{
  "reason": "Rooms are at different hostels"
}
```

---

##### 11. General Approval System

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**

###### `GET /caretaker/approvals/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List all pending approval requests (multi-purpose: check-ins, maintenance, access, guest extensions, room changes)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "guest_extension",
      "requesterId": "uuid",
      "requesterName": "Jane Doe",
      "title": "Extend visitor pass",
      "description": "Request to extend parent's visit by 2 hours",
      "priority": "low",
      "status": "pending",
      "metadata": {
        "visitorId": "uuid",
        "currentEndTime": "18:00",
        "requestedEndTime": "20:00"
      },
      "createdAt": "2024-02-01T16:00:00Z"
    }
  ]
}
```

###### `POST /caretaker/approvals/{id}/approve/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Approve general request

**Request Body:**
```json
{
  "notes": "Approved - valid reason"
}
```

###### `POST /caretaker/approvals/{id}/reject/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Reject general request

**Request Body:**
```json
{
  "reason": "Against hostel policy"
}
```

---

##### 12. Messaging System

> [!CAUTION]
> **Entire Section Missing from SETUP_GUIDE.md**

###### `GET /caretaker/conversations/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** List caretaker's conversations with students/landlord

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participantId": "uuid",
      "participantName": "Jane Doe",
      "participantRole": "student",
      "lastMessage": "Thank you for fixing the AC",
      "lastMessageTime": "2024-02-01T10:30:00Z",
      "unreadCount": 0
    }
  ]
}
```

###### `GET /caretaker/conversations/{conversationId}/messages/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Get all messages in a conversation

###### `POST /caretaker/conversations/{conversationId}/messages/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Send message in conversation

**Request Body:**
```json
{
  "content": "I'll send someone to check the AC tomorrow",
  "type": "text"
}
```

###### `POST /caretaker/conversations/{conversationId}/read/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Mark conversation as read

###### `POST /caretaker/messages/upload/`
**Status:** ⚠️ MISSING - CRITICAL  
**Purpose:** Upload file attachment for message

---

##### 13. Endpoints in SETUP_GUIDE but NOT Used in Frontend

> [!WARNING]
> The following endpoints exist in SETUP_GUIDE.md but are **NOT used** in the frontend. Decide whether to implement in frontend or remove from backend.

- `GET /caretaker/damage-reports/`
- `POST /caretaker/damage-reports/`
- `PUT /caretaker/damage-reports/`
- `GET /caretaker/inventory/`
- `POST /caretaker/inventory/`
- `GET /caretaker/notifications/` (May use global notifications endpoint instead)
- `PUT /caretaker/notifications/` (May use global notifications endpoint instead)
- `GET /caretaker/tasks/`
- `POST /caretaker/tasks/`
- `GET /caretaker/visitors/` (Frontend uses `/caretaker/visitor-invitations/` workflow instead)
- `POST /caretaker/visitors/`
- `PUT /caretaker/visitors/`

---

### 5. TECH SUPPORT DASHBOARD

#### Missing Endpoints

##### `GET /support/logs/`
**Status:** ⚠️ MISSING  
**Purpose:** System/audit logs for tech support

```python
@api_view(['GET'])
@permission_classes([IsTechSupport])
def get_support_logs(request):
    """Get system logs for tech support"""
    log_type = request.query_params.get('type', 'all')
    limit = int(request.query_params.get('limit', 100))
    
    logs = SystemLog.objects.all()
    
    if log_type != 'all':
        logs = logs.filter(log_type=log_type)
    
    logs = logs.order_by('-created_at')[:limit]
    
    serializer = SystemLogSerializer(logs, many=True)
    return Response({
        "success": True,
        "data": serializer.data
    })
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "log_type": "error",
      "severity": "high",
      "message": "Payment gateway timeout",
      "details": {"transaction_id": "123", "error_code": "TIMEOUT"},
      "user": "user@example.com",
      "timestamp": "2024-01-28T10:30:00Z",
      "resolved": false
    }
  ]
}
```

##### Hostel Management Endpoints (All Missing from SETUP_GUIDE)

###### `GET /support/hostels/`
**Purpose:** List hostels for support review

###### `POST /support/hostels/{id}/verify/`
**Purpose:** Verify hostel listing

###### `POST /support/hostels/{id}/visibility/`
**Purpose:** Toggle hostel visibility

**Request Body:**
```json
{
  "visible": false,
  "reason": "Pending verification of documentation"
}
```

###### `POST /support/hostels/{id}/flag/`
**Purpose:** Flag hostel for review

**Request Body:**
```json
{
  "reason": "Suspicious listing - unverified photos",
  "severity": "high"
}
```

---

## 🏗️ Implementation Specifications

### Profile Management Endpoints (ALL MISSING)

The frontend uses extensive profile management not in SETUP_GUIDE.md:

#### `GET /api/v1/accounts/profile/`
**Purpose:** Get current user's profile

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_profile(request):
    """Get current user's profile"""
    user = request.user
    profile_data = {
        "user": UserSerializer(user).data,
        "completion_percentage": calculate_profile_completion(user)
    }
    
    # Add role-specific profile
    if hasattr(user, 'student_profile'):
        profile_data['student_profile'] = StudentProfileSerializer(user.student_profile).data
    elif hasattr(user, 'landlord_profile'):
        profile_data['landlord_profile'] = LandlordProfileSerializer(user.landlord_profile).data
    elif hasattr(user, 'caretaker_profile'):
        profile_data['caretaker_profile'] = CaretakerProfileSerializer(user.caretaker_profile).data
    
    return Response({
        "success": True,
        "data": profile_data
    })
```

#### `GET /api/v1/accounts/users/{userId}/profile/`
**Purpose:** Get specific user's profile (admin/authorized users)

#### `PUT /api/v1/accounts/profile/`
**Purpose:** Update current user's general profile

#### `PUT /api/v1/accounts/profile/student/`
**Purpose:** Update student-specific profile fields

```python
@api_view(['PUT'])
@permission_classes([IsStudent])
def update_student_profile(request):
    """Update student-specific profile"""
    student = request.user.student_profile
    
    serializer = StudentProfileSerializer(
        student,
        data=request.data,
        partial=True
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            "success": True,
            "data": serializer.data
        })
    
    return Response({
        "success": False,
        "errors": serializer.errors
    }, status=400)
```

**Request Body:**
```json
{
  "university": "University of Nairobi",
  "course": "Computer Science",
  "year_of_study": 3,
  "student_id": "SC/2021/1234",
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+254712345678",
    "relationship": "Mother"
  }
}
```

#### `PUT /api/v1/accounts/profile/landlord/`
**Purpose:** Update landlord-specific profile

#### `PUT /api/v1/accounts/profile/caretaker/`
**Purpose:** Update caretaker-specific profile

#### `POST /api/v1/accounts/profile/upload-image/`
**Purpose:** Upload profile picture

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_image(request):
    """Upload profile picture"""
    if 'image' not in request.FILES:
        return Response({
            "success": False,
            "message": "No image file provided"
        }, status=400)
    
    image = request.FILES['image']
    
    # Validate image
    if image.size > 5 * 1024 * 1024:  # 5MB limit
        return Response({
            "success": False,
            "message": "Image size must be less than 5MB"
        }, status=400)
    
    # Process and save image
    user = request.user
    user.profile_picture = image
    user.save()
    
    return Response({
        "success": True,
        "data": {
            "profile_picture_url": user.profile_picture.url
        }
    })
```

#### `DELETE /api/v1/accounts/profile/image/`
**Purpose:** Delete profile picture

#### `PUT /api/v1/accounts/profile/lifestyle-preferences/`
**Purpose:** Update lifestyle preferences (for roommate matching)

```python
@api_view(['PUT'])
@permission_classes([IsStudent])
def update_lifestyle_preferences(request):
    """Update lifestyle preferences for roommate matching"""
    student = request.user.student_profile
    
    preferences, created = LifestylePreferences.objects.update_or_create(
        student=student,
        defaults={
            'sleep_schedule': request.data.get('sleep_schedule'),
            'cleanliness_level': request.data.get('cleanliness_level'),
            'noise_tolerance': request.data.get('noise_tolerance'),
            'visitor_frequency': request.data.get('visitor_frequency'),
            'study_hours': request.data.get('study_hours'),
            'smoking': request.data.get('smoking', False),
            'pets': request.data.get('pets', False),
            'dietary_preferences': request.data.get('dietary_preferences', [])
        }
    )
    
    return Response({
        "success": True,
        "data": LifestylePreferencesSerializer(preferences).data
    })
```

**Request Body:**
```json
{
  "sleep_schedule": "night_owl",
  "cleanliness_level": "very_clean",
  "noise_tolerance": "low",
  "visitor_frequency": "occasional",
  "study_hours": "evening",
  "smoking": false,
  "pets": false,
  "dietary_preferences": ["vegetarian", "halal"]
}
```

---

### Authentication Endpoints

#### `POST /accounts/google/`
**Status:** ⚠️ MISSING - REQUIRED for Social Auth  
**Purpose:** Google OAuth authentication

```python
from google.oauth2 import id_token
from google.auth.transport import requests

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Authenticate user with Google OAuth token"""
    token = request.data.get('token')
    
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'profile_picture_url': picture,
                'auth_provider': 'google'
            }
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "success": True,
            "data": {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": UserSerializer(user).data
            }
        })
        
    except ValueError:
        return Response({
            "success": False,
            "message": "Invalid Google token"
        }, status=400)
```

**Request Body:**
```json
{
  "token": "google_oauth_token_here"
}
```

---

### Admin Endpoints (Custom Extensions)

#### `PATCH /admin/payments/disputes/{id}/status/`
**Purpose:** Update dispute status

```python
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_dispute_status(request, id):
    """Update payment dispute status"""
    dispute = get_object_or_404(PaymentDispute, id=id)
    
    new_status = request.data.get('status')
    notes = request.data.get('notes', '')
    
    if new_status not in ['pending', 'investigating', 'resolved', 'rejected']:
        return Response({
            "success": False,
            "message": "Invalid status"
        }, status=400)
    
    dispute.status = new_status
    dispute.admin_notes = notes
    dispute.updated_by = request.user
    dispute.updated_at = timezone.now()
    dispute.save()
    
    # Send notification to parties involved
    send_dispute_update_notification(dispute)
    
    return Response({
        "success": True,
        "data": PaymentDisputeSerializer(dispute).data
    })
```

**Request Body:**
```json
{
  "status": "investigating",
  "notes": "Awaiting payment gateway confirmation"
}
```

#### `POST /admin/payments/disputes/{id}/resolve/`
**Purpose:** Resolve dispute with action

```python
@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_dispute(request, id):
    """Resolve a payment dispute"""
    dispute = get_object_or_404(PaymentDispute, id=id)
    
    resolution = request.data.get('resolution')  # 'refund', 'reject', 'partial'
    amount = request.data.get('amount')  # For partial refunds
    notes = request.data.get('notes', '')
    
    if resolution == 'refund':
        # Process refund
        refund = process_refund(dispute.transaction, amount or dispute.amount)
        dispute.resolution = 'refunded'
        dispute.refund = refund
    elif resolution == 'reject':
        dispute.resolution = 'rejected'
    
    dispute.status = 'resolved'
    dispute.resolution_notes = notes
    dispute.resolved_by = request.user
    dispute.resolved_at = timezone.now()
    dispute.save()
    
    # Notify parties
    send_dispute_resolution_notification(dispute)
    
    return Response({
        "success": True,
        "message": f"Dispute {resolution}",
        "data": PaymentDisputeSerializer(dispute).data
    })
```

**Request Body:**
```json
{
  "resolution": "refund",
  "amount": 15000.00,
  "notes": "Valid complaint - refund processed"
}
```

---

### Inventory/Check-in Endpoints

#### `GET /hostels/checkin/my-report/`
**Purpose:** Get current user's check-in report

#### `GET /hostels/checkin/{reportId}/`
**Purpose:** Get specific check-in report

#### `POST /hostels/checkin/{reportId}/approve/`
**Purpose:** Approve check-in report (caretaker/landlord)

```python
@api_view(['POST'])
@permission_classes([IsCaretakerOrLandlord])
def approve_checkin_report(request, reportId):
    """Approve student's check-in inventory report"""
    report = get_object_or_404(CheckInReport, id=reportId)
    
    # Verify user has permission for this hostel
    if not user_has_hostel_permission(request.user, report.booking.room.hostel):
        return Response({
            "success": False,
            "message": "Permission denied"
        }, status=403)
    
    report.status = 'approved'
    report.approved_by = request.user
    report.approved_at = timezone.now()
    report.approval_notes = request.data.get('notes', '')
    report.save()
    
    # Notify student
    send_notification(
        user=report.booking.student.user,
        message="Your check-in report has been approved"
    )
    
    return Response({
        "success": True,
        "message": "Check-in report approved",
        "data": CheckInReportSerializer(report).data
    })
```

---

## 🧹 Consolidation & Cleanup Tasks

### 1. Remove Duplicate Caretaker Namespace

**Action:** Delete all `/caretaker-operations/*` endpoints

**Steps:**
1. Review all `/caretaker-operations/*` endpoints
2. Ensure `/caretaker/*` has equivalent functionality
3. Create migration script if data needs to be preserved
4. Update API routing to remove old endpoints
5. Add deprecation warnings (if versioning)
6. Update all internal service calls
7. Update API documentation

**Timeline:** Complete before production deployment

---

### 2. Consolidate Admin Endpoints

You have both `/admin-endpoints/` and `/admin/admin/` namespaces.

**Recommendation:**
```
DEPRECATED: /admin-endpoints/*
PREFERRED:  /admin/*
```

**Specific Actions:**
- Move `/admin-endpoints/platform/stats/` → `/admin/platform/stats/`
- Move `/admin-endpoints/system/health/` → `/admin/system/health/`
- Move `/admin-endpoints/users/stats/` → `/admin/users/stats/`
- Remove `/admin-endpoints/landlord-verifications/` (use `/accounts/landlords/{id}/verify/` instead)

---

### 3. Remove Unused Public Website Endpoints (Optional)

If not building a public marketing website, consider removing:
- All `/home/*` endpoints

**OR** keep them dormant for future use.

---

### 4. Standardize Response Format

Ensure **ALL** endpoints use consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors */ },
  "code": "ERROR_CODE"
}
```

---

### 5. Add Pagination to List Endpoints

All `GET` endpoints returning lists should support pagination:

```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_items(request):
    """List items with pagination"""
    queryset = Item.objects.filter(user=request.user)
    
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = ItemSerializer(page, many=True)
    
    return paginator.get_paginated_response({
        "success": True,
        "data": serializer.data
    })
```

**Response:**
```json
{
  "success": true,
  "count": 150,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "data": [ /* items */ ]
}
```

---

## ✅ Testing Requirements

### For Each New Endpoint

1. **Unit Tests**
   - Test successful request
   - Test validation errors
   - Test permission denied
   - Test not found scenarios

2. **Integration Tests**
   - Test with actual database
   - Test related model updates
   - Test notification triggers

3. **Permission Tests**
   - Test role-based access
   - Test ownership verification
   - Test admin override

### Example Test Structure

```python
class TestCaretakerVisitorInvitations(APITestCase):
    def setUp(self):
        self.caretaker = create_caretaker_user()
        self.hostel = create_hostel(caretaker=self.caretaker)
        self.student = create_student_in_hostel(self.hostel)
        self.invitation = create_visitor_invitation(self.student)
    
    def test_list_invitations(self):
        """Test caretaker can list invitations"""
        self.client.force_authenticate(user=self.caretaker.user)
        response = self.client.get('/caretaker/visitor-invitations/')
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
    
    def test_approve_invitation(self):
        """Test caretaker can approve invitation"""
        self.client.force_authenticate(user=self.caretaker.user)
        response = self.client.post(
            f'/caretaker/visitor-invitations/{self.invitation.id}/approve/',
            {'notes': 'Approved for 2 hours'}
        )
        
        self.assertEqual(response.status_code, 200)
        self.invitation.refresh_from_db()
        self.assertEqual(self.invitation.status, 'approved')
    
    def test_unauthorized_access(self):
        """Test non-caretaker cannot access"""
        other_user = create_student_user()
        self.client.force_authenticate(user=other_user)
        response = self.client.get('/caretaker/visitor-invitations/')
        
        self.assertEqual(response.status_code, 403)
```

---

## 📝 Summary Checklist

### Immediate Actions (Critical Path)

- [ ] Consolidate `/caretaker/` and `/caretaker-operations/` namespaces
- [ ] Implement all caretaker workflow endpoints (visitor invitations, approvals, roommate management)
- [ ] Implement profile management endpoints (`/api/v1/accounts/profile/*`)
- [ ] Implement landlord caretaker management endpoints (`/landlord/caretakers/*`)
- [ ] Implement landlord dashboard overview with growth metrics
- [ ] Implement Google OAuth endpoint
- [ ] Add admin dispute resolution endpoints
- [ ] Add support hostel management endpoints
- [ ] Implement student dashboard aggregation endpoint improvements
- [ ] Add missing analytics endpoints (`/analytics/distribution/users/`)

### Secondary Actions

- [ ] Add inventory check-in approval endpoints
- [ ] Consolidate admin namespace endpoints
- [ ] Add system logs endpoint for tech support
- [ ] Implement lifecycle preferences endpoint
- [ ] Add unread message count endpoint
- [ ] Standardize all response formats
- [ ] Add pagination to all list endpoints

### Documentation Updates

- [ ] Update SETUP_GUIDE.md with all new endpoints
- [ ] Update API documentation with request/response examples
- [ ] Create migration guide for namespace consolidation
- [ ] Document permission requirements for each endpoint
- [ ] Create Postman collection for testing

---

## 💡 Implementation Tips

1. **Start with High-Priority Dashboards:** Admin → Student → Landlord → Caretaker → Tech Support
2. **Test Each Dashboard Independently:** Verify data flows correctly before moving to next
3. **Use Feature Flags:** Deploy endpoints gradually with feature toggles
4. **Maintain Backward Compatibility:** Use deprecation warnings for removed endpoints
5. **Version Your API:** Consider `/api/v2/` for breaking changes

---

**Questions or Issues?** Contact the frontend team for clarification on expected data structures or endpoint behavior.

**Last Updated:** 2025-12-16 10:18 EAT
