from rest_framework import serializers
from .models import User, Consultant, LineManager, Administrator, Timesheet, TimesheetEntry, PaySlip, Assignment, Client, Notification

# This file has all the serializers that convert Django models to/from JSON
# Every time the API returns data or receives data, it goes through one of these
# fields = '__all__' just means "include every field from the model"


# Converts User model to/from JSON
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


# Converts Consultant model to/from JSON
class ConsultantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultant
        fields = '__all__'


# Special version of Consultant that gets the user's name and email too
# This is for the Finance dropdowns so they can see the actual person
class ConsultantDetailSerializer(serializers.ModelSerializer):
    # These pull from the linked User model
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Consultant
        fields = ['consultantId', 'name', 'email', 'daily_rate']


# Converts LineManager model to/from JSON
class LineManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineManager
        fields = '__all__'


# Converts Administrator model to/from JSON
class AdministratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrator
        fields = '__all__'


# Used when creating or updating a timesheet
class TimesheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timesheet
        fields = '__all__'


# Extended timesheet serializer with consultant name included
# This is used when returning lists so the frontend can show "John Doe" instead of just an ID
# Also used in detail views
class TimesheetDetailSerializer(serializers.ModelSerializer):
    # This field is computed and not in the database
    consultant_name = serializers.SerializerMethodField()

    class Meta:
        model = Timesheet
        fields = '__all__'

    def get_consultant_name(self, obj):
        # Goes through the chain: Timesheet -> Consultant -> User -> name
        return obj.consultant.user.name


# Client serializer - keeps track of all available clients and their rates
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


# Used for individual days in a timesheet
# Also grabs the client name so the frontend doesn't need to do a separate lookup
class TimesheetEntrySerializer(serializers.ModelSerializer):
    # Get the client name for display
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = TimesheetEntry
        fields = '__all__'

    def get_client_name(self, obj):
        # Return the name if there is a client, otherwise None
        return obj.client.name if obj.client else None


# Used for paystubs - includes consultant name and week dates
# Finance needs these for their calculations
class PaySlipSerializer(serializers.ModelSerializer):
    # Pull from the linked Consultant and Timesheet
    consultant_name = serializers.CharField(source='consultant.user.name', read_only=True)
    week_commencing = serializers.DateField(source='timesheet.weekCommencing', read_only=True)
    week_ending = serializers.DateField(source='timesheet.weekEnding', read_only=True)

    class Meta:
        model = PaySlip
        fields = '__all__'


# Used for assignments that link consultants to clients
# Includes the daily rate for finance calculations
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'


# Used for notifications shown on the dashboard
# is_read tracks which ones the user has already seen
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
