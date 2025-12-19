# Safaricom M-Pesa API Setup Guide for RUMI Platform

This guide will walk you through setting up your Safaricom M-Pesa API credentials and testing the integration.

## Step-by-Step Setup Process

### Step 1: Register with Safaricom Developer Portal

1. **Visit Safaricom Developer Portal:**
   - Go to: https://developer.safaricom.co.ke
   - Click "Sign Up" if you don't have an account
   - Or "Sign In" if you already have an account

2. **Create Your Account:**
   - Fill in your details (name, email, phone number)
   - Verify your email and phone number
   - Complete the registration process

### Step 2: Create a New App

1. **Login to Developer Portal:**
   - Go to https://developer.safaricom.co.ke
   - Sign in with your credentials

2. **Create New App:**
   - Click "Create App" or "My Apps"
   - Select "M-Pesa Daraja API" 
   - Fill in app details:
     - **App Name:** RUMI Platform (or your preferred name)
     - **Description:** Student hostel booking payment system
     - **Category:** Financial Services
     - **Environment:** Start with "Sandbox" for testing

3. **App Types Available:**
   - **Sandbox:** For testing (FREE)
   - **Production:** For live payments (requires approval)

### Step 3: Get Your API Credentials

After creating your app, you'll get these credentials:

1. **Consumer Key** (starts with `mk_`)
2. **Consumer Secret** (long alphanumeric string)
3. **Business Shortcode** (usually `174379` for sandbox)
4. **Passkey** (you'll need to generate this)

### Step 4: Generate Passkey

1. **For Sandbox:**
   - The passkey is usually: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
   - This is the standard sandbox passkey

2. **For Production:**
   - You'll need to get this from your Safaricom business account
   - Contact Safaricom to generate a production passkey

### Step 5: Configure Your Environment

1. **Create .env file:**
   ```bash
   cd Backend
   cp .env.mpesa.example .env
   ```

2. **Edit .env file with your credentials:**
   ```bash
   # M-Pesa API Configuration
   MPESA_CONSUMER_KEY=your_consumer_key_here
   MPESA_CONSUMER_SECRET=your_consumer_secret_here
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   
   # Set to true for sandbox, false for production
   MPESA_SANDBOX=true
   
   # Webhook URLs (update with your domain)
   MPESA_CALLBACK_URL=http://localhost:8000/api/v1/payments/webhook/mpesa/stk_push
   MPESA_VALIDATION_URL=http://localhost:8000/api/v1/payments/webhook/mpesa/c2b_validation
   MPESA_CONFIRMATION_URL=http://localhost:8000/api/v1/payments/webhook/mpesa/c2b_confirmation
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

### Step 6: Test Your M-Pesa Integration

1. **Restart your Django server:**
   ```bash
   cd Backend
   python3 manage.py runserver 0.0.0.0:8000
   ```

2. **Test API Connection:**
   ```bash
   cd Backend
   python3 manage.py shell
   ```

3. **Test M-Pesa API:**
   ```python
   from payments.mpesa_api import MpesaDarajaAPI
   
   # Initialize API
   api = MpesaDarajaAPI()
   
   # Test token generation
   token = api.get_access_token()
   print(f"Access Token: {token}")
   
   if token:
       print("✓ M-Pesa API connection successful!")
   else:
       print("✗ M-Pesa API connection failed!")
   ```

### Step 7: Test Payment Flow

1. **Use Swagger Documentation:**
   - Visit: http://localhost:8000/swagger/
   - Navigate to Payments section
   - Test the M-Pesa endpoints

2. **Test Phone Numbers (Sandbox):**
   - Use these test numbers for STK Push:
     - `254708374149` (works with PIN: 254079)
     - `254700000000`
     - `254711234567`

3. **Test STK Push:**
   - Send a POST request to `/api/v1/payments/mpesa/initialize/`
   - Use
   - You a test phone number should receive an STK push on your phone

## Troubleshooting Common Issues

### Issue 1: "Failed to get access token"
**Solution:**
- Verify your Consumer Key and Consumer Secret
- Check that MPESA_SANDBOX=true
- Ensure your app is approved in sandbox

### Issue 2: "Invalid phone number format"
**Solution:**
- Use format: `254XXXXXXXXX` (12 digits)
- Or `0XXXXXXXXX` (10 digits starting with 0)
- Test numbers: `254708374149`

### Issue 3: Webhook not receiving callbacks
**Solution:**
- Ensure webhook URLs are publicly accessible
- Use ngrok for local testing: `ngrok http 8000`
- Update webhook URLs in your .env file

### Issue 4: STK Push not working
**Solution:**
- Check that the phone number is registered with M-Pesa
- Ensure sufficient balance on test number
- Verify the passkey is correct

## Testing STK Push Flow

1. **Send Test Request:**
   ```json
   {
     "booking_id": 1,
     "payment_type": "initial",
     "payment_method": "stk_push",
     "phone_number": "254708374149"
   }
   ```

2. **Expected Response:**
   ```json
   {
     "transaction_id": 789,
     "transaction_reference": "RUMI-INITIAL-1-abc12345",
     "amount": 15000.0,
     "checkout_request_id": "ws_co_123456789",
     "status": "pending_stk_push",
     "message": "STK push initiated. Please check your phone for payment prompt."
   }
   ```

3. **Check Your Phone:**
   - You should receive an M-Pesa STK prompt
   - Enter PIN: `254079`
   - Payment should complete successfully

## Moving to Production

### When Ready for Live Payments:

1. **Upgrade to Production:**
   - Apply for production access in Safaricom portal
   - Provide business details and compliance documents
   - Wait for approval (usually 1-3 business days)

2. **Get Production Credentials:**
   - Consumer Key and Secret for production
   - Your Business Shortcode
   - Production Passkey from Safaricom

3. **Update Environment:**
   ```bash
   MPESA_SANDBOX=false
   MPESA_SHORTCODE=your_production_shortcode
   MPESA_PASSKEY=your_production_passkey
   ```

4. **Update Webhook URLs:**
   - Use your production domain
   - Ensure HTTPS is enabled
   - Register URLs with Safaricom

## Pro Tips

1. **Start with Sandbox:** Always test thoroughly in sandbox first
2. **Use Test Numbers:** Safaricom provides specific test numbers
3. **Monitor Logs:** Check Django logs for any errors
4. **Test Webhooks:** Use ngrok to test webhook functionality
5. **Keep Credentials Secure:** Never commit .env file to version control

## Support

- **Safaricom Developer Support:** https://developer.safaricom.co.ke/support
- **Documentation:** https://developer.safaricom.co.ke/docs
- **API Status:** https://developer.safaricom.co.ke/status

You're now ready to integrate M-Pesa payments into your RUMI platform!