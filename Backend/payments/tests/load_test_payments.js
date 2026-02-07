/**
 * k6 Load Testing Script for Rumia Payments System
 * 
 * Tests:
 * - Payment initiation throughput
 * - M-Pesa callback processing
 * - Subscription invoice generation
 * - Concurrent payment flows
 * 
 * Run: k6 run --vus 100 --duration 5m load_test_payments.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom Metrics
const paymentSuccessRate = new Rate('payment_success_rate');
const paymentLatency = new Trend('payment_latency_ms');
const callbackProcessingTime = new Trend('callback_processing_ms');
const failedPayments = new Counter('failed_payments');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 VUs
    { duration: '5m', target: 100 },  // Stay at 100 VUs
    { duration: '2m', target: 200 },  // Peak load
    { duration: '3m', target: 100 },  // Scale down
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'payment_success_rate': ['rate>0.95'],  // 95% success rate
    'payment_latency_ms': ['p(95)<3000'],   // 95th percentile < 3s
    'http_req_duration': ['p(99)<5000'],    // 99th percentile < 5s
    'http_req_failed': ['rate<0.05'],       // Less than 5% failures
  },
};

// Test Data
const testStudentIds = Array.from({ length: 100 }, (_, i) => `student-${i + 1}`);
const testHostelIds = Array.from({ length: 20 }, (_, i) => `hostel-${i + 1}`);

/**
 * Generate random test data
 */
function getRandomStudent() {
  return testStudentIds[Math.floor(Math.random() * testStudentIds.length)];
}

function getRandomHostel() {
  return testHostelIds[Math.floor(Math.random() * testHostelIds.length)];
}

function getRandomAmount() {
  return Math.floor(Math.random() * 20000) + 5000; // KES 5,000 - 25,000
}

/**
 * Main Test Scenario
 */
export default function () {
  const studentId = getRandomStudent();
  const hostelId = getRandomHostel();
  const amount = getRandomAmount();

  // Test 1: Initiate Payment (STK Push)
  const initiatePayload = JSON.stringify({
    student_id: studentId,
    hostel_id: hostelId,
    amount: amount,
    payment_method: 'mpesa',
    phone_number: '254712345678',
  });

  const initiateHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  };

  const startTime = Date.now();
  const initiateRes = http.post(
    `${BASE_URL}/api/v1/payments/initiate/`,
    initiatePayload,
    { headers: initiateHeaders }
  );

  const initiateLatency = Date.now() - startTime;
  paymentLatency.add(initiateLatency);

  const initiateSuccess = check(initiateRes, {
    'payment initiated': (r) => r.status === 200 || r.status === 201,
    'transaction reference returned': (r) => JSON.parse(r.body).transaction_reference !== undefined,
  });

  paymentSuccessRate.add(initiateSuccess);

  if (!initiateSuccess) {
    failedPayments.add(1);
    console.error(`Payment initiation failed: ${initiateRes.status} - ${initiateRes.body}`);
    return;
  }

  const transactionRef = JSON.parse(initiateRes.body).transaction_reference;

  // Simulate M-Pesa processing delay (2-5 seconds)
  sleep(Math.random() * 3 + 2);

  // Test 2: Simulate M-Pesa Callback (C2B Confirmation)
  const callbackPayload = JSON.stringify({
    TransactionType: 'Pay Bill',
    TransID: `MPE${Date.now()}`,
    TransTime: new Date().toISOString(),
    TransAmount: amount,
    BusinessShortCode: '548548',
    BillRefNumber: transactionRef,
    InvoiceNumber: '',
    OrgAccountBalance: '',
    ThirdPartyTransID: '',
    MSISDN: '254712345678',
    FirstName: 'Test',
    MiddleName: '',
    LastName: 'Student',
  });

  const callbackStartTime = Date.now();
  const callbackRes = http.post(
    `${BASE_URL}/api/v1/payments/mpesa/c2b/confirmation/`,
    callbackPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const callbackLatency = Date.now() - callbackStartTime;
  callbackProcessingTime.add(callbackLatency);

  check(callbackRes, {
    'callback processed': (r) => r.status === 200,
    'callback acknowledged': (r) => JSON.parse(r.body).ResultCode === '0',
  });

  // Test 3: Verify Transaction Status
  sleep(1);

  const statusRes = http.get(
    `${BASE_URL}/api/v1/payments/transactions/${transactionRef}/`,
    { headers: initiateHeaders }
  );

  check(statusRes, {
    'transaction found': (r) => r.status === 200,
    'transaction marked success': (r) => JSON.parse(r.body).status === 'success',
  });

  // Simulate user think time
  sleep(Math.random() * 2 + 1);
}

/**
 * Test Subscription Invoice Generation
 */
export function subscriptionInvoiceTest() {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  };

  // Trigger invoice generation for previous month
  const res = http.post(
    `${BASE_URL}/api/v1/payments/subscriptions/generate-invoices/`,
    JSON.stringify({ billing_month: '2026-01' }),
    { headers }
  );

  check(res, {
    'invoices generated': (r) => r.status === 200,
    'invoice count returned': (r) => JSON.parse(r.body).invoices_created !== undefined,
  });
}

/**
 * Test Bed Occupancy Snapshot
 */
export function occupancySnapshotTest() {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  };

  const res = http.post(
    `${BASE_URL}/api/v1/payments/subscriptions/generate-snapshots/`,
    JSON.stringify({ target_date: '2026-02-06' }),
    { headers }
  );

  check(res, {
    'snapshots generated': (r) => r.status === 200,
    'snapshot count returned': (r) => JSON.parse(r.body).success !== undefined,
  });
}

/**
 * Spike Test - Sudden Traffic Surge
 */
export function spikeTest() {
  // Simulate Black Friday / end-of-month payment rush
  const vus = 500; // Sudden spike to 500 concurrent users
  
  for (let i = 0; i < vus; i++) {
    default();
  }
}

/**
 * Stress Test - Find Breaking Point
 */
export const stressTestOptions = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },  // Push to breaking point
    { duration: '10m', target: 0 },
  ],
};

/**
 * Soak Test - Long Duration Stability
 */
export const soakTestOptions = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '8h', target: 100 },   // Maintain load for 8 hours
    { duration: '5m', target: 0 },
  ],
};
