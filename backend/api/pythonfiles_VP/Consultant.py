#!/usr/bin/python
# -*- coding: UTF-8 -*-
import TimesheetList
import Timesheet
import Assignment
import TimeEntry
import User
from .. import views

class Consultant(User):
	def __init__(self, aUserId, aUsername, aEmail, aConsultantId):
		super.__init__(aUserId, aUsername, aEmail)
		self.__consultantId = aConsultantId
		self.__timesheets = []

	def submitTimesheet(self, aTimesheetId):

		pass

	def withdrawTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
		pass

	def editTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
		pass

	def viewTimesheets(self):
		get 
		pass

	def getConsultantId(self):
		return self.__consultantId

	def selectTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType Timesheet"""
		pass

	def updateTimeEntry(self, aTimesheetId, aEntryId, aEntry):
		"""@ParamType aTimesheetId String
		@ParamType aEntryId String
		@ParamType aEntry TimeEntry
		@ReturnType void"""
		pass



