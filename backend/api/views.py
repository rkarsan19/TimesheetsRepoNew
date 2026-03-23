from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User, Consultant, LineManager, Timesheet, TimesheetEntry, PaySlip
from .serializers import UserSerializer, ConsultantSerializer, LineManagerSerializer, TimesheetSerializer, TimesheetEntrySerializer, PaySlipSerializer

# ── TEST ──────────────────────────────────────────────
@api_view(['GET'])
def test(request):
    return Response({"message": "Django is connected!"})

# ── USERS ─────────────────────────────────────────────
@api_view(['GET'])
def getUsers(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def getUser(request, pk):
    user = User.objects.get(userID=pk)
    serializer = UserSerializer(user, many=False)
    return Response(serializer.data)

# ── LOGIN ─────────────────────────────────────────────
@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user = User.objects.get(email=email, password=password)
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# ── TIMESHEETS ────────────────────────────────────────
@api_view(['GET'])
def getTimesheets(request):
    timesheets = Timesheet.objects.all()
    serializer = TimesheetSerializer(timesheets, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def getTimesheet(request, pk):
    timesheet = Timesheet.objects.get(timesheetID=pk)
    serializer = TimesheetSerializer(timesheet, many=False)
    return Response(serializer.data)

@api_view(['POST'])
def submitTimesheet(request):
    serializer = TimesheetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def approveTimesheet(request, pk):
    timesheet = Timesheet.objects.get(timesheetID=pk)
    timesheet.status = 'APPROVED'
    timesheet.save()
    serializer = TimesheetSerializer(timesheet, many=False)
    return Response(serializer.data)

@api_view(['PUT'])
def rejectTimesheet(request, pk):
    timesheet = Timesheet.objects.get(timesheetID=pk)
    timesheet.status = 'REJECTED'
    timesheet.save()
    serializer = TimesheetSerializer(timesheet, many=False)
    return Response(serializer.data)

# ── TIMESHEET ENTRIES ─────────────────────────────────
@api_view(['GET'])
def getTimesheetEntries(request, pk):
    entries = TimesheetEntry.objects.filter(timesheet=pk)
    serializer = TimesheetEntrySerializer(entries, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def addTimesheetEntry(request):
    serializer = TimesheetEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ── PAYSLIP ───────────────────────────────────────────
@api_view(['GET'])
def getPaySlips(request):
    payslips = PaySlip.objects.all()
    serializer = PaySlipSerializer(payslips, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def calculatePay(request):
    consultant_id = request.data.get('consultant_id')
    timesheet_id = request.data.get('timesheet_id')
    try:
        consultant = Consultant.objects.get(id=consultant_id)
        timesheet = Timesheet.objects.get(timesheetID=timesheet_id)
        entries = TimesheetEntry.objects.filter(timesheet=timesheet)
        totalHours = sum(entry.hoursWorked for entry in entries)
        totalPay = totalHours * consultant.payRate
        payslip = PaySlip.objects.create(
            consultant=consultant,
            timesheet=timesheet,
            totalHours=totalHours,
            payRate=consultant.payRate,
            totalPay=totalPay
        )
        serializer = PaySlipSerializer(payslip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)