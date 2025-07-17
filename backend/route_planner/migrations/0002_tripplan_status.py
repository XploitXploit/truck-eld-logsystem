
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('route_planner', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tripplan',
            name='status',
            field=models.CharField(choices=[('planned', 'Planned'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='planned', max_length=20),
        ),
    ]
