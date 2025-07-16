
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TripPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_location', models.CharField(max_length=255)),
                ('pickup_location', models.CharField(max_length=255)),
                ('dropoff_location', models.CharField(max_length=255)),
                ('current_cycle_hours', models.FloatField(default=0.0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('total_distance', models.FloatField(blank=True, null=True)),
                ('total_duration', models.FloatField(blank=True, null=True)),
                ('route_geometry', models.JSONField(blank=True, null=True)),
                ('eld_logs', models.JSONField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='HOSViolation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('violation_type', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('severity', models.CharField(choices=[('warning', 'Warning'), ('violation', 'Violation'), ('critical', 'Critical')], max_length=20)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='route_planner.tripplan')),
            ],
        ),
    ]
