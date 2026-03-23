#!/usr/bin/python
# -*- coding: UTF-8 -*-
import TimesheetList
import PayrollRecord
import User

class FinanceTeam(User):
	def FinanceTeam(self, aUserId, aUsername, aEmail, aFinanceMemberId):
		"""@ParamType aUserId String
		@ParamType aUsername String
		@ParamType aEmail String
		@ParamType aFinanceMemberId String"""
		pass

	def exportPayReport(self, aFormat):
		"""@ParamType aFormat String
		@ReturnType File"""
		pass

	def markPayrollProcessed(self, aPayrollId):
		"""@ParamType aPayrollId String
		@ReturnType void"""
		pass

	def filterTimesheet(self, aDepartment, aRegion, aPeriodOfPay):
		"""@ParamType aDepartment String
		@ParamType aRegion String
		@ParamType aPeriodOfPay String
		@ReturnType List"""
		pass

	def getFinanceMemberId(self):
		"""@ReturnType String"""
		return self.___financeMemberId

	def __init__(self):
		self.___financeMemberId = None
		"""@AttributeType String"""
		self._timesheetList = None
		"""@AttributeType TimesheetList
		# @AssociationType TimesheetList
		# @AssociationMultiplicity 1"""
		self._payrollRecords = []
		"""@AttributeType PayrollRecord*
		# @AssociationType PayrollRecord[]
		# @AssociationMultiplicity 0..*"""

