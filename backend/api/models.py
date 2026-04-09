import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta

# ──────────────────────────────────────────────────────────────
# models.py
# Defines all the database tables for the FDM Timesheets app.
# Each class here maps to one table in Supabase (PostgreSQL).
# Django uses these to generate and run migrations automatically.
# ──────────────────────────────────────────────────────────────


# ── 1. USER ───────────────────────────────────────────────────
# Central user table. Every person in the system (consultant,
# line manager, admin, finance) has a row here.
# The role field controls which dashboard they see after login.
class User(models.Model):
    ROLES = [
        ('CONSULTANT', 'Consultant'),
        ('LINE_MANAGER', 'Line Manager'),
        ('ADMIN', 'Administrator'),
        ('FINANCE', 'Finance Team'),
    ]
    userID = models.AutoField(primary_key=True)          # Auto-incrementing primary key
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)               # Used for login; must be unique
    role = models.CharField(max_length=20, choices=ROLES)
    password = models.CharField(max_length=255)          # Stored as plain text (dev only — hash in production)
    isActive = models.BooleanField(default=True)         # Admins can deactivate accounts

    def __str__(self):
        return f"{self.name} ({self.role})"


# ── 2. CONSULTANT ─────────────────────────────────────────────
# Extends User for consultants. Linked one-to-one with User.
# consultantId is the ID used throughout the app to look up
# a consultant's timesheets.
class Consultant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, to_field='userID')
    consultantId = models.AutoField(primary_key=True)

    def __str__(self):
        return self.user.name


# ── 3. LINE MANAGER ───────────────────────────────────────────
# Extends User for line managers. Stores which department they
# manage. Line managers review and approve/reject timesheets.
class LineManager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.name


# ── 4. ADMINISTRATOR ──────────────────────────────────────────
# Extends User for admins. Admins can deactivate users and
# reset passwords via the admin dashboard.
class Administrator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.name


# ── 5. TIMESHEET ──────────────────────────────────────────────
# Represents a weekly timesheet submitted by a consultant.
# A timesheet covers Monday to Sunday (weekCommencing/weekEnding).
# Status moves through: DRAFT → SUBMITTED → APPROVED or REJECTED.
# The comments field is used for:
#   - Consultant notes (when saving as draft)
#   - Rejection reason (set by line manager when rejecting)
class Timesheet(models.Model):
    STATUS = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    timesheetID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    lineManager = models.ForeignKey(LineManager, on_delete=models.SET_NULL, null=True, blank=True)
    weekCommencing = models.DateField(null=True, blank=True)  # Always a Monday
    weekEnding = models.DateField(null=True, blank=True)      # Always the Sunday of the same week
    submitDate = models.DateField(null=True, blank=True)      # Set automatically when consultant submits
    status = models.CharField(max_length=20, choices=STATUS, default='DRAFT')
    comments = models.TextField(blank=True)                   # Dual purpose: consultant notes or rejection reason

    def __str__(self):
        return f"Timesheet {self.timesheetID} - {self.status}"


# ── 6. TIMESHEET ENTRY ────────────────────────────────────────
# One row per day within a timesheet (up to 7 rows per timesheet).
# Stores how many standard and overtime hours were worked that day,
# the work type (e.g. sick, holiday), and an optional note.
class TimesheetEntry(models.Model):
    WORK_TYPES = [
        ('STANDARD', 'Standard'),
        ('OVERTIME', 'Overtime'),
        ('SICK', 'Sick'),
        ('HOLIDAY', 'Holiday'),
    ]
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name='entries')
    date = models.DateField()                                             # The specific day this entry is for
    hoursWorked = models.DecimalField(max_digits=4, decimal_places=2, default=0)     # Standard hours
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0) # Overtime hours
    work_type = models.CharField(max_length=20, choices=WORK_TYPES, default='STANDARD')
    description = models.TextField(blank=True)                            # Optional note for that day

    def __str__(self):
        return f"{self.date} - {self.hoursWorked}hrs"


# ── 7. ASSIGNMENT ─────────────────────────────────────────────
# Links a timesheet to a client assignment.
# The consultant fills in the client name and assignment name
# when editing their timesheet so the line manager knows
# which project the hours relate to.
class Assignment(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name='assignments')
    client_name = models.CharField(max_length=200)       # e.g. "Barclays"
    assignment_name = models.CharField(max_length=200)   # e.g. "Digital Transformation Project"
    week_started = models.DateField()                    # Start of the assignment period
    week_ended = models.DateField()                      # End of the assignment period

    def __str__(self):
        return f"{self.assignment_name} - {self.client_name}"


# ── 8. PASSWORD RESET TOKEN ───────────────────────────────────
# Short-lived token generated when a user requests a password reset.
# The token is emailed as part of a reset link and expires after 1 hour.
# Once used it is marked so it cannot be replayed.
class PasswordResetToken(models.Model):
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and timezone.now() < self.created_at + timedelta(hours=1)

    def __str__(self):
        return f"ResetToken({self.email}, used={self.used})"


# ── 9. SYSTEM SETTINGS ───────────────────────────────────────
# Singleton table storing global configuration values.
# Only one row (id=1) is ever created via get_or_create.
# overtime_limit: maximum overtime hours a consultant may log per day.
class SystemSettings(models.Model):
    overtime_limit = models.DecimalField(max_digits=4, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'System Settings'

    def __str__(self):
        return f"SystemSettings (overtime_limit={self.overtime_limit})"


# ── 9. PAYSLIP ────────────────────────────────────────────────
# Generated by the Finance team. Records total hours, pay rate,
# and total pay for a consultant's approved timesheet.
class PaySlip(models.Model):
    payslipID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE)
    totalHours = models.DecimalField(max_digits=6, decimal_places=2)
    payRate = models.DecimalField(max_digits=8, decimal_places=2)
    totalPay = models.DecimalField(max_digits=10, decimal_places=2)
    generatedDate = models.DateField(auto_now_add=True)  # Set automatically to today when created

    def __str__(self):
        return f"PaySlip {self.payslipID} - {self.consultant.user.name}"
