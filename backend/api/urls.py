from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test),

    # Users
    path('users/create-user/', views.createUser, name='create-user'), #DO NOT MOVE THIS ENDPOINT, USED IN FRONTEND
    path('users/', views.getUsers),
    path('users/<str:pk>/', views.getUser),
    path('users/<int:pk>/update/', views.updateUser),
    path('consultants/<str:pk>/', views.getConsultant),

    # Admin actions
    path('users/<str:pk>/deactivate/', views.deactivateUser),
    path('users/<str:pk>/reset-password/', views.resetPassword),
    # path('users/<str:pk>/overtime-rate/', views.updateOvertimeRate),
    # path('users/<str:pk>/deadlines/', views.scheduleDeadline),

    # Login
    path('login/', views.login),

    # Timesheets
    path('timesheets/', views.getTimesheets),
    path('timesheets/create/', views.createTimesheet),
    path('timesheets/consultant/<str:consultantId>/', views.viewTimesheets),
    path('timesheets/<str:pk>/', views.getTimesheet),
    path('timesheets/<str:pk>/submit/', views.submitTimesheet),
    path('timesheets/<str:timesheetId>/edit/<str:entryId>/', views.editTimesheet),
    path('timesheets/<str:pk>/withdraw/', views.withdrawTimesheet),
    path('timesheets/<str:pk>/approve/', views.approveTimesheet),
    path('timesheets/<str:pk>/reject/', views.rejectTimesheet),
    path('timesheets/<str:pk>/entries/', views.getTimesheetEntries),
    path('timesheets/<str:pk>/save-entries/', views.saveTimesheetEntries),
    path('timesheets/<str:pk>/assignments/', views.getTimesheetAssignments),

    # Entries
    path('entries/add/', views.addTimesheetEntry),

    # Clients
    path('clients/', views.clients),
    path('clients/<str:pk>/rate/', views.updateClientRate),

    # Assignments
    path('assignments/create/', views.createAssignment),

    # Payslips
    path('payslips/', views.getPaySlips),
    path('payslips/calculate/', views.calculatePay),
    path('payslips/consultant/<str:pk>/', views.getConsultantPaySlips),

    # Finance
    path('consultants/', views.getConsultantsList),
    path('consultants/<str:pk>/rate/', views.updateConsultantRate),
    path('timesheets/<str:pk>/mark-paid/', views.markTimesheetAsPaid),

    # System settings
    path('settings/overtime-limit/', views.overtimeLimit),

    # Password reset
    path('auth/forgot-password/', views.forgotPassword),
    path('auth/reset-password/', views.resetPassword),
]
