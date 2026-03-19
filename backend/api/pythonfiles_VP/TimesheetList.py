#!/usr/bin/python
# -*- coding: UTF-8 -*-
import Timesheet
import LineManager
import FinanceTeam
import Consultant
import TimesheetStatus

class TimesheetList(object):
	def TimesheetList(self):
		pass

	def addTimehsheet(self, aTimesheet):
		"""@ParamType aTimesheet Timesheet
		@ReturnType void"""
		pass

	def removeTimesheet(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType void"""
		pass

	def getTimesheetById(self, aTimesheetId):
		"""@ParamType aTimesheetId String
		@ReturnType Timesheet"""
		pass

	def getTimesheetByStatus(self, aStatus):
		"""@ParamType aStatus TimesheetStatus
		@ReturnType List"""
		pass

	def getAllTimesheets(self):
		"""@ReturnType List"""
		pass

	def __init__(self):
		self.___timesheets = None
		"""@AttributeType List"""
		self._time_sheets = []
		"""@AttributeType Timesheet*
		# @AssociationType Timesheet[]
		# @AssociationMultiplicity 0..*"""
		self._lineManager = None
		"""@AttributeType LineManager
		# @AssociationType LineManager
		# @AssociationMultiplicity 1"""
		self._financeTeam = None
		"""@AttributeType FinanceTeam
		# @AssociationType FinanceTeam
		# @AssociationMultiplicity 1"""
		self._consultant = None
		"""@AttributeType Consultant
		# @AssociationType Consultant
		# @AssociationMultiplicity 1"""

