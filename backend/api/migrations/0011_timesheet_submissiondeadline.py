from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='timesheet',
            name='submissionDeadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
