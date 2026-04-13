import os
import uuid
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import date
from supabase import create_client
from .models import User, Consultant, LineManager, Timesheet, TimesheetEntry, PaySlip, Assignment, SystemSettings, Client, Notification
from .serializers import (
    UserSerializer, ConsultantSerializer, ConsultantDetailSerializer,
    LineManagerSerializer, TimesheetSerializer, TimesheetDetailSerializer,
    TimesheetEntrySerializer, PaySlipSerializer, AssignmentSerializer, ClientSerializer,
    NotificationSerializer,
)


# ── NOTIFICATION HELPERS ──────────────────────────────────────

def _fmt_date(d):
    """Format a date as '6 April 2026' — matches the en-GB long format used
    across the frontend (day: numeric, month: long, year: numeric)."""
    if not d:
        return '—'
    return d.strftime('%-d %B %Y')


# Creates a single Notification row. Call this from any view that
# changes a timesheet status. Silently swallows errors so a
# notification failure never breaks the main response.
def _notify(recipient_user, notif_type, timesheet, message):
    try:
        Notification.objects.create(
            recipient=recipient_user,
            notif_type=notif_type,
            timesheet=timesheet,
            message=message,
        )
    except Exception:
        pass

# ──────────────────────────────────────────────────────────────
# views.py
# Contains all the API endpoint logic for the application.
# Each function handles one HTTP request and returns a JSON
# response. The @api_view decorator restricts which HTTP methods
# each endpoint accepts (GET, POST, PUT, etc.).
# ──────────────────────────────────────────────────────────────


# ── TEST ──────────────────────────────────────────────────────
# Simple health-check endpoint. Used to verify the Django server
# is running and connected. Hit GET /api/test/ to check.
@api_view(['GET'])
def test(request):
    return Response({"message": "Django is connected!"})


# ── USERS ─────────────────────────────────────────────────────

# Returns all users in the system. Used by the admin dashboard.
@api_view(['GET'])
def getUsers(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


# Returns a single user by their userID primary key.
@api_view(['GET'])
def getUser(request, pk):
    user = User.objects.get(userID=pk)
    serializer = UserSerializer(user, many=False)
    return Response(serializer.data)


# Updates a user's details (partial update — only send the fields
# you want to change). Used by the admin dashboard.
@api_view(['PUT'])
def updateUser(request, pk):
    try:
        user = User.objects.get(userID=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    # partial=True means fields not included in the request are left unchanged
    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Returns a consultant's profile including their name, email and role.
# Also returns consultantId which the frontend stores after login.
@api_view(['GET'])
def getConsultant(request, pk):
    try:
        consultant = Consultant.objects.get(consultantId=pk)
        return Response({
            'consultantId': consultant.consultantId,
            'name': consultant.user.name,
            'email': consultant.user.email,
            'role': consultant.user.role,
        })
    except Consultant.DoesNotExist:
        return Response({'error': 'Consultant not found'}, status=status.HTTP_404_NOT_FOUND)


# ── LOGIN ─────────────────────────────────────────────────────
# Authenticates a user by email and password.
# Returns the user's data plus role-specific IDs:
#   - consultantId for CONSULTANT users (needed to fetch their timesheets)
#   - lineManagerId for LINE_MANAGER users
# The frontend stores this response in localStorage after login.
@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if user.password != password:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.isActive:
            return Response({"error": "User account is deactivated"}, status=status.HTTP_403_FORBIDDEN)

        data = dict(UserSerializer(user).data)

        # Attach role-specific IDs so the frontend knows which records belong to this user
        if user.role == 'CONSULTANT':
            try:
                data['consultantId'] = user.consultant.consultantId
            except Consultant.DoesNotExist:
                data['consultantId'] = None
        elif user.role == 'LINE_MANAGER':
            try:
                data['lineManagerId'] = user.linemanager.id
            except LineManager.DoesNotExist:
                data['lineManagerId'] = None

        return Response(data)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# ── TIMESHEETS ────────────────────────────────────────────────

# Creates a new timesheet for a consultant.
# Expects: consultantId, weekCommencing (Monday date), weekEnding (Sunday date).
# Prevents duplicate timesheets for the same consultant and week.
# @api_view(['POST'])
# def createTimesheet(request):
#     consultantId = request.data.get('consultantId')
#     weekCommencing = request.data.get('weekCommencing')
#     weekEnding = request.data.get('weekEnding')

#     if not consultantId or not weekCommencing or not weekEnding:
#         return Response(
#             {'error': 'consultantId, weekCommencing and weekEnding are required'},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     # Check if a timesheet already exists for this consultant and week
#     existing = Timesheet.objects.filter(
#         consultant__consultantId=consultantId,
#         weekCommencing=weekCommencing
#     ).exists()

#     if existing:
#         return Response(
#             {'error': 'A timesheet already exists for this week'},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     try:
#         consultant = Consultant.objects.get(consultantId=consultantId)
#     except Consultant.DoesNotExist:
#         return Response({'error': 'Consultant not found'}, status=status.HTTP_404_NOT_FOUND)

#     # Create the timesheet with DRAFT status (consultant hasn't submitted yet)
#     timesheet = Timesheet.objects.create(
#         consultant=consultant,
#         weekCommencing=weekCommencing,
#         weekEnding=weekEnding,
#         status='DRAFT'
#     )
#     serializer = TimesheetSerializer(timesheet)
#     return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def createTimesheet(request):
    data = request.data
    
    # 1. Extract values from the React request body
    consultant_id = data.get('consultantId')
    week_commencing = data.get('weekCommencing')
    week_ending = data.get('weekEnding')

    # 2. Strict Validation: Stop the crash before it hits the database
    if not consultant_id or consultant_id == "undefined":
        return Response(
            {"error": "Your session is missing a Consultant ID. Please log out and back in."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    if not week_commencing or not week_ending:
        return Response(
            {"error": "Week dates are required."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # 3. Fetch the actual Consultant object
        # We need the object instance to assign it to the ForeignKey
        consultant = Consultant.objects.get(consultantId=consultant_id)

        # 4. Create the Timesheet
        timesheet = Timesheet.objects.create(
            consultant=consultant,
            weekCommencing=week_commencing,
            weekEnding=week_ending,
            status='DRAFT' # Or your default status
        )

        serializer = TimesheetSerializer(timesheet, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Consultant.DoesNotExist:
        return Response(
            {"error": f"Consultant with ID {consultant_id} not found in database."}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Database error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Returns all timesheets in the system with consultant names included.
# Used by the line manager view to show all non-draft timesheets.
@api_view(['GET'])
def getTimesheets(request):
    timesheets = Timesheet.objects.all()
    # TimesheetDetailSerializer includes the consultant_name field
    serializer = TimesheetDetailSerializer(timesheets, many=True)
    return Response(serializer.data)


# Returns a single timesheet by its ID, including the consultant name.
# Used when a consultant opens a timesheet to view or edit it.
@api_view(['GET'])
def getTimesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({'error': 'Timesheet not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = TimesheetDetailSerializer(timesheet)
    return Response(serializer.data)


# Marks a timesheet as SUBMITTED and records today's date as the submit date.
# Once submitted, the timesheet is visible to the line manager for review.
@api_view(['PUT'])
def submitTimesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({"error": "Timesheet not found"}, status=status.HTTP_404_NOT_FOUND)
    timesheet.status = 'SUBMITTED'
    timesheet.submitDate = date.today()
    if timesheet.weekEnding <= timesheet.submitDate:
        timesheet.status = 'LATE'
    timesheet.save()

    # Notify the assigned line manager; fall back to all active line managers.
    consultant_name = timesheet.consultant.user.name
    week = _fmt_date(timesheet.weekCommencing)
    msg = f"{consultant_name} submitted a timesheet for the week of {week}."
    if timesheet.lineManager:
        _notify(timesheet.lineManager.user, 'SUBMITTED', timesheet, msg)
    else:
        for lm in LineManager.objects.select_related('user').filter(user__isActive=True):
            _notify(lm.user, 'SUBMITTED', timesheet, msg)

    serializer = TimesheetSerializer(timesheet)
    return Response(serializer.data)

'''  const getDeadline = () => {
    if (!timesheet?.weekCommencing) return '—';
    const monday = new Date(timesheet.weekCommencing + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    }) + ' · 17:00';
  };'''


# Returns all timesheets belonging to a specific consultant.
# Used to populate the consultant's timesheet list view.
@api_view(['GET'])
def viewTimesheets(request, consultantId):
    timesheets = Timesheet.objects.filter(consultant__consultantId=consultantId)
    serializer = TimesheetSerializer(timesheets, many=True)
    return Response(serializer.data)


# Reverts a submitted timesheet back to DRAFT status.
# Allows a consultant to recall a timesheet before the line manager reviews it.
@api_view(['PUT'])
def withdrawTimesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({"error": "Timesheet not found"}, status=status.HTTP_404_NOT_FOUND)
    timesheet.status = 'DRAFT'
    timesheet.save()
    serializer = TimesheetSerializer(timesheet)
    return Response(serializer.data)


# Updates a single timesheet entry (one day row) by its ID.
# Uses partial=True so only the provided fields are updated.
@api_view(['PUT'])
def editTimesheet(request, timesheetId, entryId):
    try:
        entry = TimesheetEntry.objects.get(id=entryId, timesheet__timesheetID=timesheetId)
    except TimesheetEntry.DoesNotExist:
        return Response({'error': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = TimesheetEntrySerializer(entry, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Marks a timesheet as APPROVED. Called by the line manager.
@api_view(['PUT'])
def approveTimesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({'error': 'Timesheet not found'}, status=status.HTTP_404_NOT_FOUND)
    timesheet.status = 'APPROVED'
    timesheet.save()

    week = _fmt_date(timesheet.weekCommencing)
    # Notify the consultant
    _notify(timesheet.consultant.user, 'APPROVED', timesheet,
            f"Your timesheet for the week of {week} has been approved.")
    # Notify all Finance users — it's ready for payment
    for fu in User.objects.filter(role='FINANCE', isActive=True):
        _notify(fu, 'APPROVED', timesheet,
                f"{timesheet.consultant.user.name}'s timesheet for the week of {week} is approved and ready for payment.")

    serializer = TimesheetSerializer(timesheet)
    return Response(serializer.data)


# Marks a timesheet as REJECTED and saves the line manager's reason.
# The rejection reason is stored in the comments field and displayed
# to the consultant as a banner when they open the timesheet.
@api_view(['PUT'])
def rejectTimesheet(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({'error': 'Timesheet not found'}, status=status.HTTP_404_NOT_FOUND)
    timesheet.status = 'REJECTED'
    timesheet.comments = request.data.get('comments', '')
    timesheet.save()

    week = _fmt_date(timesheet.weekCommencing)
    msg = f"Your timesheet for the week of {week} has been rejected."
    if timesheet.comments:
        msg += f" Reason: {timesheet.comments}"
    _notify(timesheet.consultant.user, 'REJECTED', timesheet, msg)

    serializer = TimesheetSerializer(timesheet)
    return Response(serializer.data)


# ── TIMESHEET ENTRIES ─────────────────────────────────────────

# Returns all daily entries for a given timesheet.
# Used by TimesheetDetail to populate the 7-day hours grid.
@api_view(['GET'])
def getTimesheetEntries(request, pk):
    entries = TimesheetEntry.objects.filter(timesheet=pk)
    serializer = TimesheetEntrySerializer(entries, many=True)
    return Response(serializer.data)


# Creates a single new timesheet entry. Used as a fallback endpoint.
# The main save flow now uses saveTimesheetEntries instead.
@api_view(['POST'])
def addTimesheetEntry(request):
    serializer = TimesheetEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Bulk-saves all 7 day entries for a timesheet in one request.
# This is the main save endpoint used by the TimesheetDetail component.
# It also:
#   - Updates the timesheet's comments field
#   - Creates or updates the linked assignment (client/assignment name)
# All existing entries are deleted and replaced on each save to keep
# things simple and avoid partial update conflicts.
@api_view(['POST'])
def saveTimesheetEntries(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({'error': 'Timesheet not found'}, status=status.HTTP_404_NOT_FOUND)

    entries_data = request.data.get('entries', [])
    comments = request.data.get('comments', '')

    # Save consultant notes to the timesheet
    timesheet.comments = comments
    timesheet.save()

    # Replace all existing entries with the new set from the frontend
    TimesheetEntry.objects.filter(timesheet=timesheet).delete()
    for entry in entries_data:
        hours = float(entry.get('hoursWorked', 0) or 0)
        overtime = float(entry.get('overtime_hours', 0) or 0)
        client_id = entry.get('client_id') or None
        client_obj = None
        if client_id:
            try:
                client_obj = Client.objects.get(clientId=client_id)
            except Client.DoesNotExist:
                pass
        TimesheetEntry.objects.create(
            timesheet=timesheet,
            date=entry['date'],
            hoursWorked=hours,
            overtime_hours=overtime,
            work_type=entry.get('work_type', 'STANDARD'),
            description=entry.get('description', ''),
            client=client_obj,
        )

    return Response({'message': 'Entries saved successfully'}, status=status.HTTP_200_OK)


# ── CLIENTS ───────────────────────────────────────────────────

# PUT /api/clients/<id>/rate/  — sets the daily rate for a client
# Used by the Finance dashboard to configure per-client pay rates.
@api_view(['PUT'])
def updateClientRate(request, pk):
    try:
        client = Client.objects.get(clientId=pk)
    except Client.DoesNotExist:
        return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)
    daily_rate = request.data.get('daily_rate')
    if daily_rate is None:
        return Response({'error': 'daily_rate is required'}, status=status.HTTP_400_BAD_REQUEST)
    client.daily_rate = daily_rate
    client.save()
    serializer = ClientSerializer(client)
    return Response(serializer.data)


# GET  /api/clients/  — returns all clients in the master list
# POST /api/clients/  — creates a new client (admin use)
@api_view(['GET', 'POST'])
def clients(request):
    if request.method == 'GET':
        all_clients = Client.objects.all().order_by('name')
        serializer = ClientSerializer(all_clients, many=True)
        return Response(serializer.data)
    # POST
    serializer = ClientSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── ASSIGNMENTS ───────────────────────────────────────────────

# Creates a new assignment record directly via JSON payload.
@api_view(['POST'])
def createAssignment(request):
    serializer = AssignmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Returns all assignments linked to a specific timesheet.
# Used by TimesheetDetail to pre-fill the client and assignment fields.
@api_view(['GET'])
def getTimesheetAssignments(request, pk):
    assignments = Assignment.objects.filter(timesheet=pk)
    serializer = AssignmentSerializer(assignments, many=True)
    return Response(serializer.data)


# ── PAYSLIP ───────────────────────────────────────────────────

# Returns all payslips in the system. Used by the Finance dashboard.
@api_view(['GET'])
def getPaySlips(request):
    payslips = PaySlip.objects.all()
    serializer = PaySlipSerializer(payslips, many=True)
    return Response(serializer.data)


# Returns all payslips for a specific consultant, ordered newest first.
# Used by the Finance dashboard Pay History panel.
@api_view(['GET'])
def getConsultantPaySlips(request, pk):
    try:
        consultant = Consultant.objects.get(consultantId=pk)
    except Consultant.DoesNotExist:
        return Response({'error': 'Consultant not found'}, status=status.HTTP_404_NOT_FOUND)
    payslips = (
        PaySlip.objects
        .filter(consultant=consultant)
        .select_related('consultant__user', 'timesheet')
        .order_by('-generatedDate')
    )
    serializer = PaySlipSerializer(payslips, many=True)
    return Response(serializer.data)


# Returns all consultants with their names and daily rates.
# Used by the Finance dashboard consultant dropdown.
@api_view(['GET'])
def getConsultantsList(request):
    consultants = Consultant.objects.select_related('user').all()
    serializer = ConsultantDetailSerializer(consultants, many=True)
    return Response(serializer.data)


# Updates the daily rate for a consultant.
# Expects: { "daily_rate": 350.00 }
@api_view(['PUT'])
def updateConsultantRate(request, pk):
    try:
        consultant = Consultant.objects.get(consultantId=pk)
    except Consultant.DoesNotExist:
        return Response({'error': 'Consultant not found'}, status=status.HTTP_404_NOT_FOUND)
    daily_rate = request.data.get('daily_rate')
    if daily_rate is None:
        return Response({'error': 'daily_rate is required'}, status=status.HTTP_400_BAD_REQUEST)
    consultant.daily_rate = daily_rate
    consultant.save()
    serializer = ConsultantDetailSerializer(consultant)
    return Response(serializer.data)


# Calculates and creates a payslip for a given consultant and timesheet.
#
# Rate priority per entry (highest wins):
#   1. Assignment.daily_rate  — where assignment.timesheet == this timesheet
#                               AND assignment.client == entry.client
#   2. Client.daily_rate      — fallback if no matching assignment
#   3. Consultant.daily_rate  — final fallback if no client or client rate
#
# Formula: hourly = rate / 8
#          entry_pay = hourly × std_hours + hourly × 1.5 × ot_hours
#
# Standard day = 8 hours (9am–5pm).
@api_view(['POST'])
def calculatePay(request):
    consultant_id = request.data.get('consultant_id')
    timesheet_id = request.data.get('timesheet_id')
    try:
        consultant = Consultant.objects.get(consultantId=consultant_id)
        timesheet = Timesheet.objects.get(timesheetID=timesheet_id)
        entries = TimesheetEntry.objects.select_related('client').filter(timesheet=timesheet)

        # Resolve the daily rate for this timesheet from its assignments.
        # Priority:
        #   1. Single assignment → its rate applies to every entry in the timesheet.
        #   2. Multiple assignments → match by assignment.client == entry.client where possible,
        #      fall back to the first assignment's rate for unmatched entries.
        #   3. No assignment → use entry.client.daily_rate or consultant.daily_rate.
        assignments = list(Assignment.objects.filter(timesheet=timesheet).select_related('client'))
        assignment_rate_by_client = {}
        assignment_default_rate = 0.0
        if len(assignments) == 1:
            assignment_default_rate = float(assignments[0].daily_rate)
        elif len(assignments) > 1:
            for asgn in assignments:
                if asgn.client_id and float(asgn.daily_rate) > 0:
                    assignment_rate_by_client[asgn.client_id] = float(asgn.daily_rate)
            # Use the largest-rate assignment as default for entries without a matching client
            assignment_default_rate = max((float(a.daily_rate) for a in assignments), default=0.0)

        STANDARD_DAY_HOURS = 8
        consultant_fallback = float(consultant.daily_rate)
        total_std_hours = 0.0
        total_ot_hours = 0.0
        total_pay = 0.0

        for entry in entries:
            std = float(entry.hoursWorked)
            ot = float(entry.overtime_hours or 0)

            if entry.client_id and entry.client_id in assignment_rate_by_client:
                rate = assignment_rate_by_client[entry.client_id]
            elif assignment_default_rate > 0:
                rate = assignment_default_rate
            elif entry.client and float(entry.client.daily_rate) > 0:
                rate = float(entry.client.daily_rate)
            else:
                rate = consultant_fallback

            hourly = rate / STANDARD_DAY_HOURS
            total_std_hours += std
            total_ot_hours += ot
            total_pay += hourly * std + hourly * 1.5 * ot

        total_hours = total_std_hours + total_ot_hours
        blended_hourly = (total_pay / total_hours) if total_hours > 0 else 0

        payslip = PaySlip.objects.create(
            consultant=consultant,
            timesheet=timesheet,
            totalHours=round(total_hours, 2),
            payRate=round(blended_hourly, 4),
            totalPay=round(total_pay, 2),
        )
        serializer = PaySlipSerializer(payslip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Marks a timesheet as PAID. Called by the Finance team after generating a payslip.
@api_view(['PUT'])
def markTimesheetAsPaid(request, pk):
    try:
        timesheet = Timesheet.objects.get(timesheetID=pk)
    except Timesheet.DoesNotExist:
        return Response({'error': 'Timesheet not found'}, status=status.HTTP_404_NOT_FOUND)
    timesheet.status = 'PAID'
    timesheet.save()

    week = _fmt_date(timesheet.weekCommencing)
    _notify(timesheet.consultant.user, 'PAID', timesheet,
            f"Your timesheet for the week of {week} has been paid.")

    serializer = TimesheetSerializer(timesheet)
    return Response(serializer.data)


# ── NOTIFICATIONS ─────────────────────────────────────────────

# Returns up to 50 most recent notifications for a user, unread first.
@api_view(['GET'])
def getNotifications(request, userId):
    notifications = (
        Notification.objects
        .filter(recipient__userID=userId)
        .order_by('is_read', '-created_at')[:50]
    )
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


# Marks a single notification as read.
@api_view(['PUT'])
def markNotificationRead(request, notifId):
    try:
        notif = Notification.objects.get(id=notifId)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    notif.is_read = True
    notif.save()
    return Response({'status': 'ok'})


# Marks every unread notification for a user as read in one query.
@api_view(['PUT'])
def markAllNotificationsRead(request, userId):
    Notification.objects.filter(recipient__userID=userId, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})


# ── ADMIN ─────────────────────────────────────────────────────

# Deactivates a user account so they can no longer log in.
# The account is not deleted — isActive is set to False.
@api_view(['PUT'])
def deactivateUser(request, pk):
    try:
        user = User.objects.get(userID=pk)
        user.isActive = False
        user.save()
        return Response({'message': 'User deactivated successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Resets a user's password to the value provided in the request body.
# Expects: { "password": "newpassword" }
@api_view(['PUT'])
def resetPassword(request, pk):
    try:
        user = User.objects.get(userID=pk)
        user.password = request.data.get('password')
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# Updates the global overtime rate.
# Expects: { "rate": 1.5 }
@api_view(['POST'])
def updateOvertimeRate(request):
    rate = request.data.get('rate')
    if rate is None:
        return Response({"error": "Rate is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Logic: Usually stored in a 'SystemConfiguration' model or similar
    # For now, we return a success response to confirm the logic hook
    return Response({"message": f"Overtime rate updated to {rate}"}, status=status.HTTP_200_OK)


# GET  /api/settings/overtime-limit/  — returns the current limit
# POST /api/settings/overtime-limit/  — sets a new limit
# Expects POST body: { "overtime_limit": 4 }
@api_view(['GET', 'POST'])
def overtimeLimit(request):
    settings, _ = SystemSettings.objects.get_or_create(id=1)
    if request.method == 'GET':
        return Response({'overtime_limit': float(settings.overtime_limit)})
    limit = request.data.get('overtime_limit')
    if limit is None:
        return Response({'error': 'overtime_limit is required'}, status=status.HTTP_400_BAD_REQUEST)
    settings.overtime_limit = limit
    settings.save()
    return Response({'overtime_limit': float(settings.overtime_limit)})


# # Schedules a submission deadline for a specific pay period.
# # Expects: { "period": "April 2026", "deadline": "2026-04-30" }
# @api_view(['POST'])
# def scheduleDeadline(request):
#     period = request.data.get('period')
#     deadline = request.data.get('deadline')
    
#     if not period or not deadline:
#         return Response({"error": "Period and Deadline are required"}, status=status.HTTP_400_BAD_REQUEST)

#     return Response({
#         "message": f"Deadline for {period} set to {deadline}"
#     }, status=status.HTTP_200_OK)


# ── PASSWORD RESET (via Supabase Auth) ───────────────────────
#
# Flow:
#   1. User submits email on the Forgot Password screen.
#   2. We verify the email exists in our User table.
#   3. We ensure a matching user exists in Supabase Auth (creating one if needed).
#   4. We call Supabase's reset_password_for_email — Supabase sends the email.
#   5. The user clicks the link, which redirects to the React app with
#      an access_token + type=recovery in the URL hash.
#   6. The React app POSTs the Supabase access_token + new password here.
#   7. We verify the token with Supabase, find the user in our table, and
#      update their password.

def _supabase_admin():
    """Return a Supabase client using the service role key (admin access)."""
    url = os.getenv('SUPABASE_URL', '')
    key = os.getenv('SUPABASE_SERVICE_KEY', '')
    return create_client(url, key)

def _supabase_anon():
    """Return a Supabase client using the anon/public key."""
    url = os.getenv('SUPABASE_URL', '')
    key = os.getenv('SUPABASE_ANON_KEY', '')
    return create_client(url, key)


# POST /api/auth/forgot-password/
# Body: { "email": "..." }
@api_view(['POST'])
def forgotPassword(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Always return the same message so we don't reveal whether an email is registered
    generic_response = Response({'message': 'If that email is registered you will receive a reset link shortly.'})

    # Step 1 — check the email exists in our own User table
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return generic_response

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    admin = _supabase_admin()

    # Step 2 — look up the user in Supabase Auth; create them if they don't exist yet
    supabase_user_id = None
    try:
        # List all auth users and find by email
        auth_users = admin.auth.admin.list_users()
        existing = next((u for u in auth_users if u.email and u.email.lower() == user.email.lower()), None)

        if existing:
            supabase_user_id = existing.id
            print(f"[INFO] Found existing Supabase Auth user: {supabase_user_id}")
        else:
            created = admin.auth.admin.create_user({
                'email': user.email,
                'email_confirm': True,
                'password': str(uuid.uuid4()),
            })
            supabase_user_id = created.user.id
            print(f"[INFO] Created Supabase Auth user: {supabase_user_id}")
    except Exception as e:
        import traceback
        print(f"[ERROR] Could not get/create Supabase Auth user: {e}")
        traceback.print_exc()
        return Response(
            {'error': f'Supabase Auth error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Step 3 — send the password reset email via Supabase
    try:
        anon = _supabase_anon()
        anon.auth.reset_password_for_email(user.email, {'redirect_to': frontend_url})
    except Exception as e:
        err_str = str(e).lower()
        if 'security purposes' in err_str or 'after' in err_str:
            return Response(
                {'error': 'A reset link was already sent recently. Please wait a minute before trying again.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        return Response(
            {'error': 'Could not send reset email. Please try again shortly.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return generic_response


# POST /api/auth/reset-password/
# Body: { "supabase_token": "<access_token from URL hash>", "password": "<new password>" }
@api_view(['POST'])
def resetPassword(request):
    supabase_token = request.data.get('supabase_token', '').strip()
    new_password   = request.data.get('password', '').strip()

    if not supabase_token or not new_password:
        return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Verify the Supabase access token and retrieve the user's email
        admin = _supabase_admin()
        response = admin.auth.get_user(supabase_token)
        email = response.user.email
    except Exception:
        return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'No account found for this email.'}, status=status.HTTP_400_BAD_REQUEST)

    user.password = new_password
    user.save()

    return Response({'message': 'Password reset successfully. You can now log in.'})


@api_view(['POST'])
def createUser(request):
    data = request.data
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role') # consultant, finance_team, or line_manager

    # 1. Basic validation
    if not name or not email or not password:
        return Response({'error': 'Please provide name, email and password'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Check existence using 'email' field (NOT username)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 3. Create the user using your specific model fields
        # Note: I'm using your database field names from the error message
        user = User.objects.create(
            name=name,
            email=email,
            password=password, # Use make_password(password) if using Django Auth
            role=role.upper(), # Highlighting roles often stored in uppercase (e.g., 'CONSULTANT')
            isActive=True
        )

        if user.role == 'CONSULTANT':
            Consultant.objects.create(user=user)
        elif user.role == 'LINE_MANAGER':
            LineManager.objects.create(user=user)
        return Response({'message': f'User {name} created successfully!'}, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        # This will catch things like database connection issues
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)