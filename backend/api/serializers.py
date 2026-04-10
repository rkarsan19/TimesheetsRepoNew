from rest_framework import serializers
from .models import User, Consultant, LineManager, Administrator, Timesheet, TimesheetEntry, PaySlip, Assignment, Client

# ──────────────────────────────────────────────────────────────
# serializers.py
# Serializers convert Django model instances to JSON (and back).
# Every API response that returns model data goes through one of
# these classes. `fields = '__all__'` includes every field on
# the model automatically.
# ──────────────────────────────────────────────────────────────


# Converts User model instances to/from JSON.
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


# Converts Consultant model instances to/from JSON.
class ConsultantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultant
        fields = '__all__'


# Converts LineManager model instances to/from JSON.
class LineManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineManager
        fields = '__all__'


# Converts Administrator model instances to/from JSON.
class AdministratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrator
        fields = '__all__'


# Basic timesheet serializer — used when creating or updating
# a timesheet (write operations).
class TimesheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timesheet
        fields = '__all__'


# Extended timesheet serializer that also includes the consultant's
# full name. Used when returning timesheet lists so the frontend
# can display "John Doe" instead of just a consultant ID number.
# Used in: getTimesheets (line manager view), getTimesheet (detail view).
class TimesheetDetailSerializer(serializers.ModelSerializer):
    # Extra computed field — not stored in the database
    consultant_name = serializers.SerializerMethodField()

    class Meta:
        model = Timesheet
        fields = '__all__'

    def get_consultant_name(self, obj):
        # Traverses the FK chain: Timesheet → Consultant → User → name
        return obj.consultant.user.name


# Master list of clients.
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


# Converts TimesheetEntry (individual day rows) to/from JSON.
# Includes client_name as a read-only computed field so the
# frontend can display the name without a separate lookup.
class TimesheetEntrySerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = TimesheetEntry
        fields = '__all__'

    def get_client_name(self, obj):
        return obj.client.name if obj.client else None


# Converts PaySlip model instances to/from JSON.
class PaySlipSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaySlip
        fields = '__all__'


# Converts Assignment model instances to/from JSON.
# Used to save/retrieve the client and assignment name
# linked to a timesheet.
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'
