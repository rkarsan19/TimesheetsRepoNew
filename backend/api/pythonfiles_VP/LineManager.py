#!/usr/bin/python
# -*- coding: UTF-8 -*-
import TimesheetList
import Timesheet
import User

class LineManager(User):
	def LineManager(self, aUserId, aUsername, aEmail, aManagerId):
		"""@ParamType aUserId String
		@ParamType aUsername String
		@ParamType aEmail String
		@ParamType aManagerId String"""
		pass

	def reviewTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
		pass

	def approveTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
		pass

	def rejectTimesheet(self, aTimesheetId, aReason):
		"""@ParamType aTimesheetId String
		@ParamType aReason String
		@ReturnType void"""
		pass

	def getManagerId(self):
		"""@ReturnType String"""
		pass

	def __init__(self):
		self.___managerID = None
		"""@AttributeType String"""
		self._timesheetList = None
		"""@AttributeType TimesheetList
		# @AssociationType TimesheetList
		# @AssociationMultiplicity 1"""
		self._timesheets = []
		"""@AttributeType Timesheet*
		# @AssociationType Timesheet[]
		# @AssociationMultiplicity 0..*"""

