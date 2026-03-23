#!/usr/bin/python
# -*- coding: UTF-8 -*-
import Timesheet
import PayCalculationMethod

class OvertimePayMethod(PayCalculationMethod):
	def calculatePay(self, aTimesheet):
		"""@ParamType aTimesheet Timesheet
		@ReturnType double"""
		pass

	def __init__(self):
		self.___overtimeMultiplier = None
		"""@AttributeType double"""

