from rest_framework import serializers
from .models import User, Consultant, LineManager, Administrator, Timesheet, TimesheetEntry, PaySlip

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class ConsultantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultant
        fields = '__all__'

class LineManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineManager
        fields = '__all__'

class AdministratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrator
        fields = '__all__'

class TimesheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timesheet
        fields = '__all__'

class TimesheetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimesheetEntry
        fields = '__all__'

class PaySlipSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaySlip
        fields = '__all__'