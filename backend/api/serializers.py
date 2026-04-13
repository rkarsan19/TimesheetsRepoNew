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


# Consultant with resolved name/email for Finance dropdowns.
class ConsultantDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Consultant
        fields = ['consultantId', 'name', 'email', 'daily_rate']


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


# Master list of clients — includes daily_rate for finance pay calculations.
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
# Includes read-only consultant name and timesheet week dates for display.
class PaySlipSerializer(serializers.ModelSerializer):
    consultant_name = serializers.CharField(source='consultant.user.name', read_only=True)
    week_commencing = serializers.DateField(source='timesheet.weekCommencing', read_only=True)
    week_ending = serializers.DateField(source='timesheet.weekEnding', read_only=True)

    class Meta:
        model = PaySlip
        fields = '__all__'


# Converts Assignment model instances to/from JSON.
# Includes daily_rate and the resolved client FK so the Finance
# dashboard can use per-assignment rates in pay calculations.
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'
