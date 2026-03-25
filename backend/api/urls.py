from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test),

    # Users
    path('users/', views.getUsers),
    path('users/<str:pk>/', views.getUser),
    path('users/<int:pk>/update', views.updateUser),




    # Login
    path('login/', views.login),

    # Timesheets
    path('timesheets/', views.getTimesheets),
    path('timesheets/<str:pk>/', views.getTimesheet),
    path('timesheets/submit/', views.submitTimesheet),
    path('timesheets/<str:pk>/approve/', views.approveTimesheet),
    path('timesheets/<str:pk>/reject/', views.rejectTimesheet),

    # Timesheet Entries
    path('timesheets/<str:pk>/entries/', views.getTimesheetEntries),
    path('entries/add/', views.addTimesheetEntry),

    # Payslips
    path('payslips/', views.getPaySlips),
    path('payslips/calculate/', views.calculatePay),
]