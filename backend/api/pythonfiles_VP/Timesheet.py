#!/usr/bin/python
# -*- coding: UTF-8 -*-
import TimesheetStatus
import Consultant
import LineManager
import TimesheetList
import TimeEntry
import Assignment
import PayrollRecord

class Timesheet(object):
	def Timesheet(self, aConsultantId, aWeekId):
		"""@ParamType aConsultantId String
		@ParamType aWeekId String"""
		pass

	def calculateTotalHours(self, aTotalHours, aOvertimeHours):
		"""@ParamType aTotalHours double
		@ParamType aOvertimeHours double
		@ReturnType double"""
		pass

	def submit(self):
		"""@ReturnType void"""
		pass

	def withdraw(self):
		"""@ReturnType void"""
		pass

	def addEntry(self, aEntry):
		"""@ParamType aEntry TimeEntry
		@ReturnType void"""
		pass

	def setStatus(self, aStatus):
		"""@ParamType aStatus TimesheetStatus
		@ReturnType void"""
		self.___status = aStatus

	def setRejectionReason(self, aReason):
		"""@ParamType aReason String
		@ReturnType void"""
		pass

	def setComments(self, aComments):
		"""@ParamType aComments String
		@ReturnType void"""
		self.___comments = aComments

	def getTimesheetId(self):
		"""@ReturnType String"""
		return self.___timesheetId

	def getComments(self):
		"""@ReturnType String"""
		return self.___comments

	def getRejectionReason(self):
		"""@ReturnType String"""
		pass

	def getWeekCommencing(self):
		"""@ReturnType Date"""
		return self.___weekCommencing

	def getWeekEnding(self):
		"""@ReturnType Date"""
		return self.___weekEnding

	def viewEntries(self):
		"""@ReturnType List"""
		pass

	def __init__(self):
		self.___timesheetId = None
		"""@AttributeType String"""
		self.___status = DRAFT
		"""@AttributeType TimesheetStatus"""
		self.___submissionDate = None
		"""@AttributeType DateTime"""
		self.___submissionDeadline = None
		"""@AttributeType DateTime"""
		self.___totalHours = None
		"""@AttributeType double"""
		self.___comments = None
		"""@AttributeType String"""
		self.___reasonForRejection = None
		"""@AttributeType String"""
		self.___overtimeHours = None
		"""@AttributeType double"""
		self.___weekCommencing = None
		"""@AttributeType Date"""
		self.___weekEnding = None
		"""@AttributeType Date"""
		self._consultant = None
		"""@AttributeType Consultant
		# @AssociationType Consultant
		# @AssociationMultiplicity 1"""
		self._lineManager = None
		"""@AttributeType LineManager
		# @AssociationType LineManager
		# @AssociationMultiplicity 1"""
		self._timesheetList = None
		"""@AttributeType TimesheetList
		# @AssociationType TimesheetList
		# @AssociationMultiplicity 1"""
		self._timesheetEntries = []
		"""@AttributeType TimeEntry*
		# @AssociationType TimeEntry[]
		# @AssociationMultiplicity 1..7
		# @AssociationKind Composition"""
		self._assignment = None
		"""@AttributeType Assignment
		# @AssociationType Assignment
		# @AssociationMultiplicity 1"""
		self._payrollRecord = None
		"""@AttributeType PayrollRecord
		# @AssociationType PayrollRecord
		# @AssociationMultiplicity 0..1"""

