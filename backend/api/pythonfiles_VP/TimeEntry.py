#!/usr/bin/python
# -*- coding: UTF-8 -*-
import WorkType
import Timesheet

class TimeEntry(object):
	def TimeEntry(self, aDate, aHoursWorked):
		"""@ParamType aDate Date
		@ParamType aHoursWorked double"""
		pass

	def calculateDailyTotal(self):
		"""@ReturnType double"""
		pass

	def getNotes(self):
		"""@ReturnType String"""
		return self.___notes

	def editTimeEntry(self, aHoursWorked, aOvertimeHours, aWorkTypeStatus, aNotes):
		"""@ParamType aHoursWorked double
		@ParamType aOvertimeHours double
		@ParamType aWorkTypeStatus WorkType
		@ParamType aNotes String
		@ReturnType void"""
		pass

	def getTimeEntryInfo(self):
		"""@ReturnType String"""
		pass

	def getEntryId(self):
		"""@ReturnType String"""
		return self.___entryId

	def __init__(self):
		self.___entryId = None
		"""@AttributeType String"""
		self.___date = None
		"""@AttributeType Date"""
		self.___hoursWorked = None
		"""@AttributeType double"""
		self.___overtimeHours = None
		"""@AttributeType double"""
		self.___workTypeStatus = None
		"""@AttributeType WorkType"""
		self.___notes = None
		"""@AttributeType String"""
		self._timesheet = None
		"""@AttributeType Timesheet
		# @AssociationType Timesheet
		# @AssociationMultiplicity 1"""

