from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("hostels", "0022_review_reviewimage_reviewhelpful_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="hostel",
            name="is_restricted",
            field=models.BooleanField(
                default=False,
                help_text="If True, the hostel management is in Read-Only mode due to payment issues.",
            ),
        ),
    ]
