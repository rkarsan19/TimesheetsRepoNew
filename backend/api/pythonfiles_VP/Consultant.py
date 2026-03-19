#!/usr/bin/python
# -*- coding: UTF-8 -*-
import TimesheetList
import Timesheet
import Assignment
import TimeEntry
import User

class Consultant(User):
	def Consultant(self, aUserId, aUsername, aEmail, aConsultantId):
		"""@ParamType aUserId String
		@ParamType aUsername String
		@ParamType aEmail String
		@ParamType aConsultantId String"""
		pass

	def submitTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
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
		"""@ReturnType List"""
		pass

	def getConsultantId(self):
		"""@ReturnType String"""
		return self.___consultantId

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

	def __init__(self):
		self.___consultantId = None
		"""@AttributeType String"""
		self.___timsheets = None
		"""@AttributeType List"""
		self._timesheetList = None
		"""@AttributeType TimesheetList
		# @AssociationType TimesheetList
		# @AssociationMultiplicity 1"""
		self._timeSheets = []
		"""@AttributeType Timesheet*
		# @AssociationType Timesheet[]
		# @AssociationMultiplicity 0..*"""
		self._assignment = []
		"""@AttributeType Assignment*
		# @AssociationType Assignment[]
		# @AssociationMultiplicity 1..*"""

