#!/usr/bin/python
# -*- coding: UTF-8 -*-
import PayrollRecord

class PaySlip(object):
	def PaySlip(self, aPayrollId):
		"""@ParamType aPayrollId String"""
		pass

	def download(self):
		"""@ReturnType File"""
		pass

	def getPayslipId(self):
		"""@ReturnType String"""
		return self.___payslipId

	def getGeneratedDate(self):
		"""@ReturnType Date"""
		return self.___generatedDate

	def getDownloadURL(self):
		"""@ReturnType String"""
		return self.___downloadURL

	def setDownloadURL(self, aUrl):
		"""@ParamType aUrl String
		@ReturnType void"""
		self.___downloadURL = aUrl

	def __init__(self):
		self.___payslipId = None
		"""@AttributeType String"""
		self.___generatedDate = None
		"""@AttributeType Date"""
		self.___downloadURL = None
		"""@AttributeType String"""
		self._payrollRecord = None
		"""@AttributeType PayrollRecord
		# @AssociationType PayrollRecord
		# @AssociationMultiplicity 1"""

