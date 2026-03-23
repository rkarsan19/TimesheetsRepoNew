#!/usr/bin/python
# -*- coding: UTF-8 -*-
import PayCalculationMethod
import PayrollRecord
import Timesheet

class PayrollProcessor(object):
	___instance = None
	"""@AttributeType PayrollProcessor"""

	def PayrollProcessor(self, aMethod):
		"""@ParamType aMethod PayCalculationMethod"""
		pass

	def setMethod(self, aMethod):
		"""@ReturnType void"""
		pass

	def executePayroll(self, aTimesheet):
		"""@ParamType aTimesheet Timesheet
		@ReturnType PayrollRecord"""
		pass

	def getInstance(self, aMethod):
		"""@ParamType aMethod PayCalculationMethod
		@ReturnType PayrollProcessor"""
		pass

	def __init__(self):
		self.___method = None
		"""@AttributeType PayCalculationMethod"""
		self._produces = []
		"""@AttributeType PayrollRecord*
		# @AssociationType PayrollRecord[]
		# @AssociationMultiplicity 0..*"""

