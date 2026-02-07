# Rumia Payments System - Security Audit Checklist

**Version**: 1.0  
**Last Updated**: 2026-02-07  
**Compliance Standards**: PCI-DSS, GDPR, Kenya DPA 2019

---

## 1. Payment Data Security

### 1.1 PCI-DSS Compliance

- [ ] **No card data storage**: Verify system does NOT store card numbers, CVV, or PINs
- [ ] **M-Pesa only**: Confirm all payments via M-Pesa (no direct card processing)
- [ ] **Transaction logs sanitized**: Ensure no sensitive data in logs
- [ ] **Callback signature verification**: Validate M-Pesa callbacks are signed
- [ ] **HTTPS enforcement**: All payment endpoints HTTPS-only

**Verification**:
```bash
# Check for PAN (Primary Account Number) patterns in logs
grep -r "4[0-9]{15}" /var/log/rumia/ 
# Should return NOTHING

# Verify HTTPS redirect
curl -v http://api.rumia.com/payments/ 
# Should return 301 → HTTPS
```

---

### 1.2 Data Encryption

- [ ] **Database encryption at rest**: PostgreSQL TDE enabled
- [ ] **Transit encryption**: TLS 1.3 for all API communication
- [ ] **Secrets management**: API keys in environment variables (not code)
- [ ] **M-Pesa credentials**: Stored in AWS Secrets Manager or HashiCorp Vault

**Test**:
```bash
# Check database encryption
psql -c "SHOW ssl;" rumia_production
# Should show: on

# Verify no hardcoded secrets
grep -r "CONSUMER_KEY\|CONSUMER_SECRET" Backend/
# Should return NOTHING in committed code
```

---

## 2. Authentication & Authorization

### 2.1 API Authentication

- [ ] **JWT token expiry**: Access tokens expire in <15 minutes
- [ ] **Refresh token rotation**: New refresh token issued on refresh
- [ ] **Rate limiting**: Max 100 requests/minute per user
- [ ] **Multi-factor authentication**: MFA enforced for landlords/admins

**Test**:
```bash
# Test expired token rejection
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
  https://api.rumia.com/payments/transactions/
# Should return 401 Unauthorized

# Test rate limiting
for i in {1..150}; do 
  curl https://api.rumia.com/payments/initiate/; 
done
# Should return 429 Too Many Requests after 100
```

---

### 2.2 Authorization (RBAC)

- [ ] **Role separation**: Student ≠ Landlord ≠ Admin permissions
- [ ] **Bed-level access control**: Students only see own bed payments
- [ ] **Hostel isolation**: Landlords only see own hostel data
- [ ] **Admin audit trail**: All admin actions logged with user ID

**Test Cases**:
```python
# Student trying to access another student's payment
response = client.get('/payments/transactions/OTHER_STUDENT_REF/', 
                      headers={'Authorization': 'Bearer STUDENT_TOKEN'})
assert response.status_code == 403

# Landlord trying to access another hostel's data
response = client.get('/landlord/hostel/OTHER_HOSTEL_ID/invoices/', 
                      headers={'Authorization': 'Bearer LANDLORD_TOKEN'})
assert response.status_code == 403
```

---

## 3. Input Validation & Injection Prevention

### 3.1 SQL Injection

- [ ] **Parameterized queries**: All DB queries use Django ORM or prepared statements
- [ ] **No raw SQL**: Avoid `.raw()` and `.extra()` methods
- [ ] **Input sanitization**: Validate all user inputs (amount, phone, account numbers)

**Test**:
```bash
# SQL injection attempt via account number
curl -X POST https://api.rumia.com/payments/initiate/ \
  -d '{"account_number": "KBH-101-A; DROP TABLE transactions;--"}'
# Should return 400 Bad Request (validation error)
```

---

### 3.2 XSS Prevention

- [ ] **Output encoding**: All user-generated content HTML-escaped
- [ ] **CSP headers**: Content-Security-Policy prevents inline scripts
- [ ] **No `innerHTML`**: Frontend uses React (auto-escapes)

**Test**:
```javascript
// XSS attempt via payment memo
const payload = {
  memo: '<script>alert("XSS")</script>'
};
// Should be stored as &lt;script&gt;alert("XSS")&lt;/script&gt;
```

---

## 4. M-Pesa Security

### 4.1 Callback Signature Verification

- [ ] **Signature validation**: Verify M-Pesa callback signatures
- [ ] **IP whitelisting**: Only accept callbacks from M-Pesa IPs
- [ ] **Replay attack prevention**: Reject duplicate `TransID`

**Implementation**:
```python
# In mpesa_webhooks.py
def verify_mpesa_signature(request):
    signature = request.headers.get('X-Safaricom-Signature')
    payload = request.body
    
    expected_signature = hmac.new(
        settings.MPESA_PUBLIC_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)
```

---

### 4.2 Idempotency

- [ ] **Duplicate prevention**: `TransID` unique constraint in database
- [ ] **Distributed locks**: Redis locks for callback processing
- [ ] **Webhook deduplication**: Check `WebhookEvent` table before processing

**Test**:
```bash
# Send same callback twice
curl -X POST https://api.rumia.com/mpesa/c2b/confirmation/ \
  -d @callback_payload.json

curl -X POST https://api.rumia.com/mpesa/c2b/confirmation/ \
  -d @callback_payload.json

# Second call should return 200 OK but not create duplicate transaction
```

---

## 5. GDPR & Data Privacy

### 5.1 Personal Data Handling

- [ ] **Data minimization**: Only collect necessary data (name, phone, email)
- [ ] **Right to erasure**: Implement user deletion endpoint
- [ ] **Data retention policy**: Auto-delete after 7 years
- [ ] **Privacy policy**: Clear statement on payment data usage

**Endpoints Required**:
- `DELETE /api/v1/users/{id}/` - Delete user and pseudonymize payment records
- `GET /api/v1/users/{id}/export/` - Export user data (GDPR Article 20)

---

### 5.2 Consent Management

- [ ] **Explicit consent**: Checkbox for data processing (not pre-checked)
- [ ] **Withdrawal mechanism**: Users can withdraw consent
- [ ] **Audit trail**: Log all consent changes

---

## 6. Logging & Monitoring

### 6.1 Security Logging

- [ ] **Authentication failures**: Log all failed login attempts
- [ ] **Authorization denials**: Log 403 responses with user ID
- [ ] **Payment failures**: Log M-Pesa error codes
- [ ] **Admin actions**: Log all manual overrides

**Log Format**:
```json
{
  "timestamp": "2026-02-07T12:54:08Z",
  "event": "payment_failure",
  "user_id": "student-123",
  "hostel_id": "hostel-456",
  "amount": 15000,
  "error_code": "insufficient_funds",
  "ip_address": "41.90.x.x"
}
```

---

### 6.2 Anomaly Detection

- [ ] **Unusual payment patterns**: Alert on 10x average transaction amount
- [ ] **Geographic anomalies**: Flag payments from unexpected countries
- [ ] **Velocity checks**: Alert on >5 payments in 1 minute from same user

---

## 7. Incident Response

### 7.1 Runbooks

- [ ] **Data breach response**: Documented procedure for data leaks
- [ ] **M-Pesa downtime**: Fallback procedures
- [ ] **Payment reconciliation**: Manual reconciliation runbook

---

### 7.2 Security Contact

- [ ] **Security email**: security@rumia.com published
- [ ] **Bug bounty program**: HackerOne or similar platform
- [ ] **Responsible disclosure policy**: 90-day disclosure timeline

---

## 8. Dependency Security

### 8.1 Vulnerability Scanning

- [ ] **Python packages**: Run `pip-audit` weekly
- [ ] **Node packages**: Run `npm audit` weekly
- [ ] **Docker images**: Scan with Trivy or Snyk

**Commands**:
```bash
# Python
pip-audit --require-hashes

# Node
npm audit --production

# Docker
trivy image rumia/backend:latest
```

---

### 8.2 Dependency Pinning

- [ ] **requirements.txt**: Pin exact versions (not `>=`)
- [ ] **package-lock.json**: Committed to repo
- [ ] **Auto-updates**: Dependabot enabled

---

## 9. Infrastructure Security

### 9.1 Network Security

- [ ] **Firewall rules**: Database not publicly accessible
- [ ] **VPC isolation**: Backend in private subnet
- [ ] **Bastion host**: SSH access via bastion only
- [ ] **DDoS protection**: Cloudflare or AWS Shield enabled

---

### 9.2 Access Control

- [ ] **Principle of least privilege**: IAM roles scoped narrowly
- [ ] **SSH key rotation**: Keys rotated every 90 days
- [ ] **No root SSH**: Root login disabled
- [ ] **Sudo logging**: All sudo commands logged

---

## 10. Penetration Testing

### 10.1 Manual Testing

- [ ] **OWASP Top 10**: Test for all OWASP vulnerabilities
- [ ] **Business logic flaws**: Test payment amount manipulation
- [ ] **Race conditions**: Test concurrent payment attempts

**Test Cases**:
```python
# Race condition: Double-spend attack
import threading

def initiate_payment():
    client.post('/payments/initiate/', data={'amount': 15000})

threads = [threading.Thread(target=initiate_payment) for _ in range(10)]
for t in threads:
    t.start()

# Should only create 1 transaction (idempotency)
```

---

### 10.2 Automated Scanning

- [ ] **OWASP ZAP**: Weekly automated scans
- [ ] **Burp Suite**: Manual testing with Burp Pro
- [ ] **Nikto**: Web server vulnerability scan

---

## Compliance Sign-Off

- [ ] **Security Officer**: ______________________  Date: ________
- [ ] **CTO**: ______________________  Date: ________
- [ ] **Legal Counsel**: ______________________  Date: ________

---

## Next Review Date: **2026-05-07** (Quarterly)
