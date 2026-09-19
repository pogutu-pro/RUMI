"""
Built-in message catalog: every email and SMS RumiaRent sends on its own.

These messages are written in code (accounts/tasks.py, rent/services/,
billing/services/, organizations/services/, home/tasks.py), not stored as
database templates, so the admin Notifications page would otherwise show two
empty template tabs next to a non-zero "sent" count. This is the read-only
list shown there. Keep it in step with the sending code: `tests` check that
each subject here still appears in the source that sends it.

`body` uses {placeholders}; `variables` lists them; `source_file` says where
the wording lives.
"""

EMAIL_CATALOG = [
    {
        'template_id': 'verification_code',
        'name': 'Email verification code',
        'trigger': 'Someone registers, signs in without a verified email, or asks for a new code.',
        'subject': 'Verify Your RumiaRent Account',
        'body': (
            'Hi {first_name},\n\nWelcome to RumiaRent! Please verify your email address using this code:\n\n'
            '{otp_code}\n\nThis code will expire in 5 minutes.\n\n'
            "If you didn't create an account, please ignore this email."
        ),
        'variables': ['first_name', 'otp_code'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'welcome',
        'name': 'Welcome',
        'trigger': 'A user verifies their email address.',
        'subject': 'Welcome to RumiaRent!',
        'body': (
            'Hi {first_name},\n\nWelcome to RumiaRent! Your account has been successfully verified.\n\n'
            'You can now sign in and:\n- Manage your properties, units and tenants\n'
            '- Collect rent securely with Paystack\n- Send rent reminders by SMS and email\n\n'
            'Sign in to get started: {dashboard_url}'
        ),
        'variables': ['first_name', 'dashboard_url'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'tenant_invite',
        'name': 'Tenant invitation',
        'trigger': 'A landlord or caretaker adds a tenant.',
        'subject': 'You have been added to RumiaRent',
        'body': (
            'Hi {first_name},\n\nYou have been added as a tenant{property_line} on RumiaRent.\n\n'
            'Set up your password to log in and view your tenancy, rent balance, and payment history:\n'
            '{setup_url}\n\nThis link will expire in 24 hours.'
        ),
        'variables': ['first_name', 'property_line', 'setup_url'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'caretaker_invite',
        'name': 'Caretaker invitation',
        'trigger': 'A landlord adds a caretaker.',
        'subject': 'You have been added to RumiaRent',
        'body': (
            'Hi {first_name},\n\nYou have been added as a caretaker on RumiaRent.\n\n'
            'Set up your password to log in and manage your assigned properties and tenants:\n'
            '{setup_url}\n\nThis link will expire in 24 hours.'
        ),
        'variables': ['first_name', 'setup_url'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'password_reset',
        'name': 'Password reset',
        'trigger': 'Someone uses "Forgot password".',
        'subject': 'Reset Your RumiaRent Password',
        'body': (
            'Hi {first_name},\n\nYou requested a password reset for your RumiaRent account. '
            'Click this link to reset your password:\n{reset_url}\n\nThis link will expire in 24 hours.\n\n'
            "If you didn't request this reset, please ignore this email."
        ),
        'variables': ['first_name', 'reset_url'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'rent_reminder',
        'name': 'Rent reminder',
        'trigger': 'Rent is coming due or overdue (daily reminder job).',
        'subject': 'Rent reminder: RumiaRent',
        'body': (
            'Hi {tenant_name},\n\nThis is a reminder that KES {amount} is due for unit {unit} on {due_date}.\n\nThank you.'
        ),
        'variables': ['tenant_name', 'amount', 'unit', 'due_date'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'payment_confirmation',
        'name': 'Payment received',
        'trigger': 'A rent payment succeeds, or a landlord or caretaker records a cash, bank or M-Pesa payment.',
        'subject': 'Payment received: RumiaRent',
        'body': (
            'Hi {tenant_name},\n\nWe received your payment of KES {amount} for unit {unit}.\n'
            'Reference: {reference}\nDate: {date}\n\nThank you.'
        ),
        'variables': ['tenant_name', 'amount', 'unit', 'reference', 'date'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'overdue_next_of_kin',
        'name': 'Overdue rent (next of kin)',
        'trigger': 'Rent stays overdue and the tenant consented to their next of kin being contacted.',
        'subject': 'Overdue rent: RumiaRent',
        'body': (
            'Hi {contact_name},\n\nYou are listed as a contact for {tenant_name}, who has an overdue rent balance '
            'of KES {amount} for unit {unit} (due {due_date}).\n\nPlease help settle this balance or reach out to '
            '{tenant_name} directly.\n\nThank you.'
        ),
        'variables': ['contact_name', 'tenant_name', 'amount', 'unit', 'due_date'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'subscription_renewal',
        'name': 'Subscription renewal reminder',
        'trigger': 'A landlord on manual billing is within three days of their renewal date.',
        'subject': 'Your RumiaRent subscription is due for renewal',
        'body': (
            'Hi {owner_name},\n\nYour {plan} subscription (KES {price}) for {organization} is due for renewal on '
            '{renewal_date}.\n\nSince your subscription is on manual billing, please arrange payment before then '
            'to avoid any interruption to your account.\n\nThank you.'
        ),
        'variables': ['owner_name', 'plan', 'price', 'organization', 'renewal_date'],
        'source_file': 'billing/services/notifications.py',
    },
    {
        'template_id': 'mri_reminder',
        'name': 'Rental income tax (MRI) reminder',
        'trigger': "Five days and one day before the 20th, and the day after, if last month's MRI is not marked as filed.",
        'subject': 'Rental income tax (MRI) for {month}',
        'body': (
            'Hi {first_name},\n\n{headline}\n\n{detail}\n\n'
            'File and pay on iTax or eRITS by {deadline}. RumiaRent prepares these figures but does not file for you.\n\n'
            'Open Accounting in RumiaRent to see the breakdown and mark the month as filed.\n\n'
            'This is a reminder, not tax advice.'
        ),
        'variables': ['first_name', 'headline', 'detail', 'deadline'],
        'source_file': 'accounting/tasks.py',
    },
    {
        'template_id': 'payout_setup_incomplete',
        'name': 'Payout setup incomplete',
        'trigger': "A tenant tries to pay rent but the landlord's payout details are not complete (at most once a day).",
        'subject': 'Action needed: a tenant tried to pay rent but payout setup is incomplete',
        'body': (
            'Hi,\n\nA tenant just attempted to pay rent for {organization}, but this organization has not completed '
            'Paystack payout setup yet, so the payment could not be processed.\n\nPlease complete your bank details / '
            'payout setup as soon as possible so future rent payments can be collected.\n\nThank you.'
        ),
        'variables': ['organization'],
        'source_file': 'organizations/services/notifications.py',
    },
    {
        'template_id': 'landlord_approved',
        'name': 'Landlord account approved',
        'trigger': 'A super admin approves a landlord.',
        'subject': 'RumiaRent Landlord Account Approved',
        'body': (
            'Hi {first_name},\n\nCongratulations! Your landlord account has been approved.\n\nYou can now:\n'
            '- Manage your properties, units and tenants\n- Collect rent securely with Paystack\n'
            '- Receive payouts to your bank account\n\nSign in to get started: {dashboard_url}'
        ),
        'variables': ['first_name', 'dashboard_url'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'landlord_declined',
        'name': 'Landlord application declined',
        'trigger': 'A super admin declines a landlord application.',
        'subject': 'RumiaRent Landlord Application Update',
        'body': (
            'Hi {first_name},\n\nThank you for your interest in RumiaRent. Unfortunately, we are unable to approve '
            'your landlord application at this time.\n\nReason: {reason}\n\nYou can reapply after addressing the '
            'issues mentioned.'
        ),
        'variables': ['first_name', 'reason'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'account_deactivated',
        'name': 'Account deactivated',
        'trigger': 'An admin deactivates a user account.',
        'subject': 'RumiaRent Account Deactivated',
        'body': (
            'Hi {first_name},\n\nYour RumiaRent account has been deactivated.\n\nReason: {reason}\n\n'
            'If you believe this is an error, please contact support.'
        ),
        'variables': ['first_name', 'reason'],
        'source_file': 'accounts/tasks.py',
    },
    {
        'template_id': 'inquiry_received',
        'name': 'Contact inquiry received',
        'trigger': 'Someone submits the public contact form.',
        'subject': 'RumiaRent Contact Inquiry Received - {reference_number}',
        'body': (
            'Hi {full_name},\n\nThank you for contacting RumiaRent! We have received your inquiry and will respond '
            'within 24 hours.\n\nReference Number: {reference_number}\nSubject: {subject}\nYour Message: {message}'
        ),
        'variables': ['full_name', 'reference_number', 'subject', 'message'],
        'source_file': 'home/tasks.py',
    },
    {
        'template_id': 'inquiry_admin_alert',
        'name': 'New contact inquiry (to the team)',
        'trigger': 'Someone submits the public contact form.',
        'subject': 'New Contact Inquiry - {inquiry_type}',
        'body': (
            'New contact inquiry received:\n\nFrom: {full_name} ({email})\nPhone: {phone}\nType: {inquiry_type}\n'
            'Subject: {subject}\nMessage: {message}\n\nPlease respond within 24 hours.'
        ),
        'variables': ['full_name', 'email', 'phone', 'inquiry_type', 'subject', 'message'],
        'source_file': 'home/tasks.py',
    },
    {
        'template_id': 'newsletter_verification',
        'name': 'Newsletter confirmation',
        'trigger': 'Someone subscribes to the newsletter.',
        'subject': 'Verify Your RumiaRent Newsletter Subscription',
        'body': (
            'Hi {name},\n\nThank you for subscribing to the RumiaRent newsletter! Please verify your email address by '
            'clicking the link below:\n{verification_link}\n\nThis link will expire in 7 days.'
        ),
        'variables': ['name', 'verification_link'],
        'source_file': 'home/tasks.py',
    },
]

SMS_CATALOG = [
    {
        'template_id': 'sms_rent_reminder',
        'name': 'Rent reminder (SMS)',
        'trigger': 'Rent is coming due or overdue (daily reminder job).',
        'message': 'RumiaRent: KES {amount} rent due for unit {unit} on {due_date}.',
        'variables': ['amount', 'unit', 'due_date'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'sms_payment_confirmation',
        'name': 'Payment received (SMS)',
        'trigger': 'A rent payment succeeds, or a landlord or caretaker records a cash, bank or M-Pesa payment.',
        'message': 'RumiaRent: Payment of KES {amount} received. Ref: {reference}.',
        'variables': ['amount', 'reference'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'sms_overdue_next_of_kin',
        'name': 'Overdue rent (next of kin, SMS)',
        'trigger': 'Rent stays overdue and the tenant consented to their next of kin being contacted.',
        'message': (
            'RumiaRent: {tenant_name} has an overdue rent balance of KES {amount} for unit {unit}. '
            'You are listed as their contact for this.'
        ),
        'variables': ['tenant_name', 'amount', 'unit'],
        'source_file': 'rent/services/notifications.py',
    },
    {
        'template_id': 'sms_subscription_renewal',
        'name': 'Subscription renewal (SMS)',
        'trigger': 'A landlord on manual billing is within three days of their renewal date.',
        'message': (
            'RumiaRent: your {plan} subscription (KES {price}) renews on {renewal_date}. '
            'Please arrange payment to avoid interruption.'
        ),
        'variables': ['plan', 'price', 'renewal_date'],
        'source_file': 'billing/services/notifications.py',
    },
    {
        'template_id': 'sms_payout_setup_incomplete',
        'name': 'Payout setup incomplete (SMS)',
        'trigger': "A tenant tries to pay rent but the landlord's payout details are not complete (at most once a day).",
        'message': (
            'RumiaRent: a tenant tried to pay rent for {organization} but payout setup is incomplete. '
            'Please complete payout setup to receive rent.'
        ),
        'variables': ['organization'],
        'source_file': 'organizations/services/notifications.py',
    },
]
