# Migration to update to 2% service fee model (landlord gets full rent)

from django.db import migrations, models
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        # Update landlord_commission to always be 0
        migrations.AlterField(
            model_name='transaction',
            name='landlord_commission',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='withholding_tax',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
        
        # Remove old constraints
        migrations.RemoveConstraint(
            model_name='transaction',
            name='check_student_fee_calculation',
        ),
        migrations.RemoveConstraint(
            model_name='transaction',
            name='check_total_charged_calculation',
        ),
        migrations.RemoveConstraint(
            model_name='transaction',
            name='check_landlord_commission_calculation',
        ),
        migrations.RemoveConstraint(
            model_name='transaction',
            name='check_landlord_payout_calculation',
        ),
        migrations.RemoveConstraint(
            model_name='transaction',
            name='check_gross_revenue_calculation',
        ),
        
        # Add new constraints (2% service fee model)
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                check=models.Q(student_service_fee=models.F('base_rent') * 0.02),
                name='check_service_fee_2_percent'
            ),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                check=models.Q(total_charged_amount=models.F('base_rent') + models.F('student_service_fee')),
                name='check_total_with_service_fee'
            ),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                check=models.Q(landlord_payout_amount=models.F('base_rent')),
                name='check_landlord_gets_full_rent'
            ),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                check=models.Q(landlord_commission=0.00),
                name='check_no_landlord_commission'
            ),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.CheckConstraint(
                check=models.Q(gross_platform_revenue=models.F('student_service_fee')),
                name='check_platform_revenue_from_service_fee'
            ),
        ),
    ]