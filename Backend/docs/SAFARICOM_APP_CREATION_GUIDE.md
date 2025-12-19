# Safaricom M-Pesa Sandbox App Creation Guide

## 🎯 **Application Setup Configuration**

### **Application Name:**
```
RUMI Student Housing Platform
```

### **Description:**
```
Student hostel booking and roommate matching platform with integrated M-Pesa payments for online and offline transactions
```

### **✅ REQUIRED API SELECTIONS:**

#### **1. Lipa na Mpesa Sandbox** ✅ **MUST SELECT**
- **Purpose:** STK Push (Online Payments)
- **Use Case:** Students pay via phone prompts
- **Critical:** This handles the "online" payments in your system

#### **2. Mpesa Sandbox** ✅ **MUST SELECT**  
- **Purpose:** C2B (Offline Payments)
- **Use Case:** Direct M-Pesa payments without prompts
- **Critical:** This handles the "offline" payments in your system

### **❌ NOT REQUIRED for RUMI:**

- **Pre-tups sandbox** - Not needed for your use case
- **Bill Manager sandbox** - For utility bill payments
- **B2B Express checkout** - Business-to-business payments
- **Mpesa Ratiba sandbox** - Payment schedules
- **IOT API's sandbox** - Internet of Things
- **IMSI Sandbox** - International Mobile Subscriber Identity
- **SWAP sandbox** - For SIM swap operations
- **B2Pochi Sandbox** - Business to customer payments
- **Pull Transactions sandbox** - Pulling money from customers

## 📝 **Quick Setup Steps:**

1. **Application Name:** `RUMI Student Housing Platform`
2. **Select ONLY:** 
   - ✅ **Lipa na Mpesa Sandbox**
   - ✅ **Mpesa Sandbox**
3. **Description:** Student hostel booking and roommate matching platform with integrated M-Pesa payments
4. **Environment:** Keep as **Sandbox** for testing
5. **Click "Create App"**

## 🔑 **After Creation, You'll Get:**
- **Consumer Key** (starts with `mk_`)
- **Consumer Secret** (long string)
- **Business Shortcode** (usually `174379`)

## 🚀 **Next Steps:**
1. Copy your Consumer Key and Consumer Secret
2. Update your `.env` file
3. Run the test script to verify connection

## ✅ **These 2 APIs Cover Your Requirements:**
- **Online Payments:** Lipa na M-Pesa (STK Push)
- **Offline Payments:** M-Pesa C2B
- **Complete Coverage:** Both payment methods supported