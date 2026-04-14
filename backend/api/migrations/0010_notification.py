import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_assignment_client_fk_and_daily_rate'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('notif_type', models.CharField(
                    choices=[
                        ('SUBMITTED', 'Submitted'),
                        ('APPROVED', 'Approved'),
                        ('REJECTED', 'Rejected'),
                        ('PAID', 'Paid'),
                    ],
                    max_length=20,
                )),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to='api.user',
                )),
                ('timesheet', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notifications',
                    to='api.timesheet',
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
