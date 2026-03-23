from django.db import models

# ── 1. USER ──────────────────────────────────────────
class User(models.Model):
    ROLES = [
        ('CONSULTANT', 'Consultant'),
        ('LINE_MANAGER', 'Line Manager'),
        ('ADMIN', 'Administrator'),
        ('FINANCE', 'Finance Team'),
    ]
    userID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES)
    password = models.CharField(max_length=255)
    isActive = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.role})"


# ── 2. CONSULTANT ─────────────────────────────────────
class Consultant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    skills = models.TextField(blank=True)
    payRate = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.user.name


# ── 3. LINE MANAGER ───────────────────────────────────
class LineManager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.name


# ── 4. ADMINISTRATOR ──────────────────────────────────
class Administrator(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.name


# ── 5. TIMESHEET ──────────────────────────────────────
class Timesheet(models.Model):
    STATUS = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    timesheetID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    lineManager = models.ForeignKey(LineManager, on_delete=models.SET_NULL, null=True)
    submitDate = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default='DRAFT')
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"Timesheet {self.timesheetID} - {self.status}"


# ── 6. TIMESHEET ENTRY ────────────────────────────────
class TimesheetEntry(models.Model):
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name='entries')
    date = models.DateField()
    hoursWorked = models.DecimalField(max_digits=4, decimal_places=2)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.date} - {self.hoursWorked}hrs"


# ── 7. PAYSLIP ────────────────────────────────────────
class PaySlip(models.Model):
    payslipID = models.AutoField(primary_key=True)
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE)
    totalHours = models.DecimalField(max_digits=6, decimal_places=2)
    payRate = models.DecimalField(max_digits=8, decimal_places=2)
    totalPay = models.DecimalField(max_digits=10, decimal_places=2)
    generatedDate = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"PaySlip {self.payslipID} - {self.consultant.user.name}"