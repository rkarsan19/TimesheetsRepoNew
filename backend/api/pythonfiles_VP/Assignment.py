#!/usr/bin/python
# -*- coding: UTF-8 -*-
import Consultant
import Timesheet
import DailyRate

class Assignment(object):
	def Assignment(self, aConsultantId, aClientName):
		"""@ParamType aConsultantId String
		@ParamType aClientName String"""
		pass

	def isActive(self):
		"""@ReturnType Boolean"""
		pass

	def getAssignment(self):
		"""@ReturnType String"""
		pass

	def getClientName(self):
		"""@ReturnType String"""
		return self.___clientName

	def setClientName(self, aClientName):
		"""@ParamType aClientName String
		@ReturnType void"""
		self.___clientName = aClientName

	def getDescription(self):
		"""@ReturnType String"""
		return self.___description

	def setDescription(self, aDescription):
		"""@ParamType aDescription String
		@ReturnType void"""
		self.___description = aDescription

	def getStartDate(self):
		"""@ReturnType Date"""
		return self.___startDate

	def getEndDate(self):
		"""@ReturnType Date"""
		return self.___endDate

	def setEndDate(self, aDate):
		"""@ParamType aDate Date
		@ReturnType void"""
		self.___endDate = aDate

	def getClientDetails(self):
		"""@ReturnType String"""
		pass

	def updateAssignment(self, aDescription, aEndDate):
		"""@ParamType aDescription String
		@ParamType aEndDate Date
		@ReturnType void"""
		pass

	def __init__(self):
		self.___assignmentId = None
		"""@AttributeType String"""
		self.___clientName = None
		"""@AttributeType String"""
		self.___clientIndustry = None
		"""@AttributeType String"""
		self.___clientContactEmail = None
		"""@AttributeType String"""
		self.___clientRegion = None
		"""@AttributeType String"""
		self.___clientTimeZone = None
		"""@AttributeType String"""
		self.___description = None
		"""@AttributeType String"""
		self.___startDate = None
		"""@AttributeType Date"""
		self.___endDate = None
		"""@AttributeType Date"""
		self._consultant = None
		"""@AttributeType Consultant
		# @AssociationType Consultant
		# @AssociationMultiplicity 1"""
		self._timesheet = None
		"""@AttributeType Timesheet
		# @AssociationType Timesheet
		# @AssociationMultiplicity 1"""
		self._dailyRates = None
		"""@AttributeType DailyRate
		# @AssociationType DailyRate
		# @AssociationMultiplicity 1"""

