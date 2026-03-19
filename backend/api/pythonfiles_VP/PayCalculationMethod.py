#!/usr/bin/python
# -*- coding: UTF-8 -*-
from abc import ABCMeta, abstractmethod
import Timesheet

class PayCalculationMethod(object):
	"""@Interface"""
	__metaclass__ = ABCMeta
	@abstractmethod
	def calculatePay(self, aTimesheet):
		"""@ParamType aTimesheet Timesheet
		@ReturnType double"""
		pass

