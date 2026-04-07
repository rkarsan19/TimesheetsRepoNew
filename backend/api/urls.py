from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test),

    # Users
    path('users/', views.getUsers),
    path('users/<str:pk>/', views.getUser),
    path('users/<int:pk>/update/', views.updateUser),
    path('consultants/<str:pk>/', views.getConsultant),

    # Admin actions
    path('users/<str:pk>/deactivate/', views.deactivateUser),
    path('users/<str:pk>/reset-password/', views.resetPassword),

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

    # Assignments
    path('assignments/create/', views.createAssignment),

    # Payslips
    path('payslips/', views.getPaySlips),
    path('payslips/calculate/', views.calculatePay),
]
