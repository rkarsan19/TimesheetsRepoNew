from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test),

    # User endpoints
    path('users/create-user/', views.createUser, name='create-user'), # IMPORTANT: dont move this, frontend needs it
    path('users/', views.getUsers),
    path('users/<str:pk>/', views.getUser),
    path('users/<int:pk>/update/', views.updateUser),
    path('consultants/<str:pk>/', views.getConsultant),

    # Stuff only admins can do
    path('users/<str:pk>/deactivate/', views.deactivateUser),
    path('users/<str:pk>/reset-password/', views.adminResetPassword),
    # path('users/<str:pk>/overtime-rate/', views.updateOvertimeRate),
    # path('users/<str:pk>/deadlines/', views.scheduleDeadline),

    # Login endpoint
    path('login/', views.login),

    # Timesheet endpoints - create, view, edit, and submit them
    path('timesheets/', views.getTimesheets),
    path('timesheets/create/', views.createTimesheet),
    path('timesheets/consultant/<str:consultantId>/', views.viewTimesheets),
    path('timesheets/<str:pk>/', views.getTimesheet),
    path('timesheets/<str:pk>/submit/', views.submitTimesheet),
    path('timesheets/<str:timesheetId>/edit/<str:entryId>/', views.editTimesheet),
    path('timesheets/<str:pk>/withdraw/', views.withdrawTimesheet),
    # Line managers approve or reject timesheets
    path('timesheets/<str:pk>/approve/', views.approveTimesheet),
    path('timesheets/<str:pk>/reject/', views.rejectTimesheet),
    path('timesheets/<str:pk>/entries/', views.getTimesheetEntries),
    path('timesheets/<str:pk>/save-entries/', views.saveTimesheetEntries),
    path('timesheets/<str:pk>/assignments/', views.getTimesheetAssignments),

    # Add individual entries to a timesheet
    path('entries/add/', views.addTimesheetEntry),

    # Client management
    path('clients/', views.clients),
    path('clients/<str:pk>/rate/', views.updateClientRate),

    # Assignments link consultants to clients
    path('assignments/create/', views.createAssignment),

    # Finance team uses these to generate and view payslips
    path('payslips/', views.getPaySlips),
    path('payslips/calculate/', views.calculatePay),
    path('payslips/consultant/<str:pk>/', views.getConsultantPaySlips),

    # Finance dashboard endpoints
    path('consultants/', views.getConsultantsList),
    path('consultants/<str:pk>/rate/', views.updateConsultantRate),
    path('timesheets/<str:pk>/mark-paid/', views.markTimesheetAsPaid),

    # Notifications - put specific paths first before the catch-all
    path('notifications/<str:userId>/read-all/', views.markAllNotificationsRead),
    path('notifications/<str:notifId>/read/', views.markNotificationRead),
    path('notifications/<str:userId>/', views.getNotifications),

    # Global settings
    path('settings/overtime-limit/', views.overtimeLimit),

    # Password reset flow
    path('auth/forgot-password/', views.forgotPassword),
    path('auth/reset-password/', views.resetPassword),
]
