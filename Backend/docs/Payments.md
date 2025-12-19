Payments

Bank Payments

Bank payments are handled by the Paystack API. Users provide their bank details, which the API validates and processes to complete the transaction securely.

Credit Card Payments

Credit card payments are managed via the Paystack API. Users enter their card details, and the API validates and processes the payment. Paystack's card processing features are utilized for seamless integration.


M-Pesa Payments
M-Pesa payments are facilitated through Safaricom's M-Pesa API. The system allows landlords to input their preferred payment methods, such as Send Money, Till Number, Pochi la Biashara, or Paybill Number. The API then directs funds to the specified numbers based on user inputs.


MPESA APIs
OAuth - For generating access tokens to authenticate all requests.
C2B - For webhook registration on each landlord's Paybill and handling offline callbacks.
M-Pesa Express - Lipa na M-Pesa for triggering STK Push prompts.


Customer to Business (C2B)


Webhooks Callback
Offline payments are managed using Safaricom's C2B API. Customer-initiated transactions (e.g., direct payments via phone) trigger real-time webhooks to a centralized confirmation URL. Structured references (e.g., hostelID and invoice) enable the multi-tenant system to parse, validate, and allocate funds instantly. This updates the database and reflects changes on personalized dashboards: students see confirmed bookings, while landlords track earnings per property.


Testing Webhooks with Ngrok


For webhook testing during development, an ngrok account has been created to expose local servers to public URLs, as C2B requires HTTPS domains (not localhost). Install ngrok, run your server locally (e.g., on port 3000), and use ngrok http 3000 to generate a temporary public URL (e.g., https://abc123.ngrok.io/your-endpoint). Register this URL in the Daraja portal via the C2B Register URL endpoint for sandbox testing. Note that free tier URLs change on restart; re-register as needed, or upgrade for static domains.


Machine Learning for Subscription Pricing

Supervised Regression

A supervised regression model (linear or gradient boosting via scikit-learn) is trained on historical payment data from the platform. Inputs include landlord earnings, average rent prices, hostel size, occupancy rates, and user counts. The model predicts fair subscription fees, ensuring smaller hostels pay modestly while larger ones contribute proportionally, promoting equity across users.