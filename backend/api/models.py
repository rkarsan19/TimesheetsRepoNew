import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta

# This file has all the database tables/models for the timesheet app
# Each class becomes a table in the database
# Django uses these to handle all the database stuff automatically


# USER MODEL
# Every person in the system is a User (consultant, manager, admin, finance)
# The role field decides what dashboard they see after logging in
class User(models.Model):
    ROLES = [
        ('CONSULTANT', 'Consultant'),
        ('LINE_MANAGER', 'Line Manager'),
        ('ADMIN', 'Administrator'),
        ('FINANCE', 'Finance Team'),
    ]
    userID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)  # Must be unique for login
    role = models.CharField(max_length=20, choices=ROLES)
    password = models.CharField(max_length=255)  # TODO: hash this in production not plain text
    isActive = models.BooleanField(default=True)  # Admins can turn this off to disable accounts

    def __str__(self):
        return f"{self.name} ({self.role})"


# CONSULTANT MODEL
# The profile for consultants, linked one-to-one with User
# consultantId is used everywhere in the app to find a consultant
class Consultant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, to_field='userID')
    consultantId = models.AutoField(primary_key=True)
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return self.user.name


# LINE MANAGER MODEL
# For line managers who review and approve timesheets
# They manage a specific department
class LineManager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)  # The department they manage

    def __str__(self):
        return self.user.name


# ADMINISTRATOR MODEL
# For admins who can deactivate users and reset passwords
class Administrator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.name


# TIMESHEET MODEL
# Represents a weekly timesheet that a consultant fills out
# Starts on Monday (weekCommencing) and ends on Sunday (weekEnding)
# Status flow: DRAFT -> SUBMITTED -> APPROVED (or REJECTED)
# Comments field is used for consultant notes when saving, or rejection reasons from the manager
class Timesheet(models.Model):
    STATUS = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
    ]
    timesheetID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    lineManager = models.ForeignKey(LineManager, on_delete=models.SET_NULL, null=True, blank=True)
    weekCommencing = models.DateField(null=True, blank=True)  # Always a Monday
    weekEnding = models.DateField(null=True, blank=True)  # Always the Sunday of that week
    submitDate = models.DateField(null=True, blank=True)  # Set when consultant submits
    submissionDeadline = models.DateTimeField(null=True, blank=True)  # Usually Sunday at 9pm
    status = models.CharField(max_length=20, choices=STATUS, default='DRAFT')
    comments = models.TextField(blank=True)  # For notes or rejection reasons

    def __str__(self):
        return f"Timesheet {self.timesheetID} - {self.status}"


# CLIENT MODEL
# List of all clients that consultants can work on
# Admins manage this list
# Each client has their own daily rate
class Client(models.Model):
    clientId = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return self.name


# TIMESHEET ENTRY MODEL
# One entry per day in a timesheet
# Stores hours worked, overtime, work type (normal/sick/holiday), and which client
class TimesheetEntry(models.Model):
    WORK_TYPES = [
        ('STANDARD', 'Standard'),
        ('OVERTIME', 'Overtime'),
        ('SICK', 'Sick'),
        ('HOLIDAY', 'Holiday'),
    ]
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name='entries')
    date = models.DateField()
    hoursWorked = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    work_type = models.CharField(max_length=20, choices=WORK_TYPES, default='STANDARD')
    description = models.TextField(blank=True)  # Optional notes about the day
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries')

    def __str__(self):
        return f"{self.date} - {self.hoursWorked}hrs"


# ASSIGNMENT MODEL
# Links a timesheet to a client assignment
# Consultants fill this in when editing their timesheet
# The line manager uses this to see which project the hours are for
class Assignment(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name='assignments')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    client_name = models.CharField(max_length=200)  # Kept for display and old data
    assignment_name = models.CharField(max_length=200)  # The project name
    week_started = models.DateField()
    week_ended = models.DateField()
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.assignment_name} - {self.client_name}"


# PASSWORD RESET TOKEN MODEL
# Generated when someone requests a password reset
# Token is sent via email and expires after 1 hour
# Can only be used once
class PasswordResetToken(models.Model):
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)  # True after its used once

    def is_valid(self):
        # Check if token hasnt been used and hasnt expired
        return not self.used and timezone.now() < self.created_at + timedelta(hours=1)

    def __str__(self):
        return f"ResetToken({self.email}, used={self.used})"


# SYSTEM SETTINGS MODEL
# Global configuration for the whole app
# Only one row ever exists (id=1), created automatically
# overtime_limit is the max hours someone can log as overtime in one day
class SystemSettings(models.Model):
    overtime_limit = models.DecimalField(max_digits=4, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'System Settings'

    def __str__(self):
        return f"SystemSettings (overtime_limit={self.overtime_limit})"


# PAYSLIP MODEL
# Generated by Finance when they process timesheets
# Stores total hours, pay rate, and total pay for one consultant's timesheet
class PaySlip(models.Model):
    payslipID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE)
    totalHours = models.DecimalField(max_digits=6, decimal_places=2)
    payRate = models.DecimalField(max_digits=8, decimal_places=2)
    totalPay = models.DecimalField(max_digits=10, decimal_places=2)
    generatedDate = models.DateField(auto_now_add=True)  # Set automatically when created

    def __str__(self):
        return f"PaySlip {self.payslipID} - {self.consultant.user.name}"


# NOTIFICATION MODEL
# Shows up in the notification bell on the dashboard
# Created automatically when a timesheet status changes
# Sent to the relevant person (consultant, manager, finance)
class Notification(models.Model):
    TYPES = [
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notif_type = models.CharField(max_length=20, choices=TYPES)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)  # False until user clicks it
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # Newest first

    def __str__(self):
        return f"Notification({self.recipient.name}, {self.notif_type}, read={self.is_read})"
