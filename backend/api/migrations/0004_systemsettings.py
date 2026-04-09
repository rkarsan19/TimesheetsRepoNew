from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_timesheetentry_overtime_hours_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('overtime_limit', models.DecimalField(decimal_places=2, default=0, max_digits=4)),
            ],
            options={
                'verbose_name': 'System Settings',
            },
        ),
    ]
