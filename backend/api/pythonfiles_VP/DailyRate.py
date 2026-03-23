#!/usr/bin/python
# -*- coding: UTF-8 -*-
import Assignment

class DailyRate(object):
	def DailyRate(self, aAmount, aCurrency, aEffectiveDate):
		"""@ParamType aAmount double
		@ParamType aCurrency String
		@ParamType aEffectiveDate Date"""
		pass

	def getRateId(self):
		"""@ReturnType String"""
		return self.___rateId

	def getAmount(self):
		"""@ReturnType double"""
		return self.___amount

	def getCurrency(self):
		"""@ReturnType String"""
		return self.___currency

	def getEffectiveDate(self):
		"""@ReturnType Date"""
		return self.___effectiveDate

	def updateRate(self, aAmount, aCurrency):
		"""@ParamType aAmount double
		@ParamType aCurrency String
		@ReturnType void"""
		pass

	def getRateDetails(self):
		"""@ReturnType String"""
		pass

	def __init__(self):
		self.___rateId = None
		"""@AttributeType String"""
		self.___amount = None
		"""@AttributeType double"""
		self.___currency = None
		"""@AttributeType String"""
		self.___effectiveDate = None
		"""@AttributeType Date"""
		self._assignment = None
		"""@AttributeType Assignment
		# @AssociationType Assignment
		# @AssociationMultiplicity 1"""

