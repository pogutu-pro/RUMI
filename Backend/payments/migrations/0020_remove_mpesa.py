from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0019_transaction_bed_transaction_hostel_paymentauditlog'),
    ]

    operations = [
        # Remove M-Pesa-specific index from RentPeriod before removing fields
        migrations.RemoveIndex(
            model_name='rentperiod',
            name='payments_re_assigne_8872b4_idx',
        ),
        # Remove paybill/account-ref fields from RentPeriod
        migrations.RemoveField(
            model_name='rentperiod',
            name='assigned_paybill',
        ),
        migrations.RemoveField(
            model_name='rentperiod',
            name='student_account_ref',
        ),
        # Remove M-Pesa-specific fields from Transaction
        migrations.RemoveField(
            model_name='transaction',
            name='mpesa_checkout_request_id',
        ),
        migrations.RemoveField(
            model_name='transaction',
            name='mpesa_merchant_request_id',
        ),
        migrations.RemoveField(
            model_name='transaction',
            name='mpesa_receipt_number',
        ),
        migrations.RemoveField(
            model_name='transaction',
            name='mpesa_phone_number',
        ),
        # Drop M-Pesa payment config model
        migrations.DeleteModel(
            name='MpesaPaymentConfig',
        ),
        # Drop hostel-level M-Pesa config model
        migrations.DeleteModel(
            name='HostelPaymentConfig',
        ),
        # Update payment_method choices to Paystack-only
        migrations.AlterField(
            model_name='transaction',
            name='payment_method',
            field=models.CharField(
                choices=[('paystack', 'Card/Bank (Paystack)')],
                max_length=20,
            ),
        ),
    ]
