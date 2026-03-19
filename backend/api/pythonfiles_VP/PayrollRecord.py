#!/usr/bin/python
# -*- coding: UTF-8 -*-
import PayrollStatus
import FinanceTeam
import Timesheet
import PayrollProcessor
import PaySlip

class PayrollRecord(object):
	def PayrollRecord(self, aPayPeriod, aTimesheetId):
		"""@ParamType aPayPeriod String
		@ParamType aTimesheetId String"""
		pass

	def generatePaySlip(self):
		"""@ReturnType Payslip"""
		pass

	def getPayrollId(self):
		"""@ReturnType String"""
		return self.___payrollId

	def getPayPeriod(self):
		"""@ReturnType String"""
		return self.___payPeriod

	def getGrossPay(self):
		"""@ReturnType double"""
		return self.___grossPay

	def getTaxDeduction(self):
		"""@ReturnType double"""
		pass

	def getNiDeduction(self):
		"""@ReturnType double"""
		pass

	def getNetPay(self):
		"""@ReturnType double"""
		pass

	def getProcessingTimeStamp(self):
		"""@ReturnType Date"""
		return self.___processingTimeStamp

	def getStatus(self):
		"""@ReturnType PayrollStatus"""
		return self.___status

	def finalisePayroll(self):
		"""@ReturnType void"""
		pass

	def markAsFailed(self):
		"""@ReturnType void"""
		pass

	def isProcessed(self):
		"""@ReturnType Boolean"""
		pass

	def __init__(self):
		self.___payrollId = None
		"""@AttributeType String"""
		self.___payPeriod = None
		"""@AttributeType String"""
		self.___grossPay = None
		"""@AttributeType double"""
		self.___taxDeduction = None
		"""@AttributeType Double"""
		self.___niDeduction = None
		"""@AttributeType Double"""
		self.___netPay = None
		"""@AttributeType Double"""
		self.___processingTimeStamp = None
		"""@AttributeType Date"""
		self.___status = None
		"""@AttributeType PayrollStatus"""
		self._financeTeam = None
		"""@AttributeType FinanceTeam
		# @AssociationType FinanceTeam
		# @AssociationMultiplicity 1"""
		self._time_sheet = None
		"""@AttributeType Timesheet
		# @AssociationType Timesheet
		# @AssociationMultiplicity 1"""
		self._produces = None
		"""@AttributeType PayrollProcessor
		# @AssociationType PayrollProcessor
		# @AssociationMultiplicity 1"""
		self._payslip = None
		"""@AttributeType PaySlip
		# @AssociationType PaySlip
		# @AssociationMultiplicity 1"""

