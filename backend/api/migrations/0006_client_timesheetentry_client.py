import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_passwordresettoken'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('clientId', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
            ],
        ),
        migrations.AddField(
            model_name='timesheetentry',
            name='client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entries',
                to='api.client',
            ),
        ),
    ]
