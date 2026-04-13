from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_client_timesheetentry_client'),
    ]

    operations = [
        migrations.AddField(
            model_name='consultant',
            name='daily_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        # Updating STATUS choices on Timesheet to include PAID.
        # Django CharField choices are not enforced at the DB level,
        # so this migration records the change without altering the column.
        migrations.AlterField(
            model_name='timesheet',
            name='status',
            field=models.CharField(
                choices=[
                    ('DRAFT', 'Draft'),
                    ('SUBMITTED', 'Submitted'),
                    ('APPROVED', 'Approved'),
                    ('REJECTED', 'Rejected'),
                    ('PAID', 'Paid'),
                ],
                default='DRAFT',
                max_length=20,
            ),
        ),
    ]
