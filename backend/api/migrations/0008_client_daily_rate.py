from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_consultant_daily_rate_timesheet_paid_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='daily_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
