import django.db.models.deletion
from django.db import migrations, models


def populate_assignment_clients(apps, schema_editor):
    """
    For every Assignment:
      1. Look up (or create) a Client whose name matches assignment.client_name.
      2. Set assignment.client = that Client.
    This consolidates the freetext client_name into proper FK records so the
    pay calculation can look up daily_rate via assignment.client.
    """
    Assignment = apps.get_model('api', 'Assignment')
    Client = apps.get_model('api', 'Client')

    for assignment in Assignment.objects.all():
        name = (assignment.client_name or '').strip()
        if not name:
            continue
        client, _ = Client.objects.get_or_create(name=name)
        assignment.client = client
        assignment.save(update_fields=['client'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_client_daily_rate'),
    ]

    operations = [
        # daily_rate already exists in the Supabase DB — tell Django's state
        # about it without touching the actual column.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='assignment',
                    name='daily_rate',
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
                ),
            ],
            database_operations=[],  # column is already there
        ),

        # Add the new client FK column to the DB.
        migrations.AddField(
            model_name='assignment',
            name='client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assignments',
                to='api.client',
            ),
        ),

        # Populate assignment.client from assignment.client_name.
        migrations.RunPython(populate_assignment_clients, migrations.RunPython.noop),
    ]
