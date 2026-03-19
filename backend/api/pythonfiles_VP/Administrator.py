#!/usr/bin/python
# -*- coding: UTF-8 -*-
import User

class Administrator(User):
	def Administrator(self, aUserId, aUsername, aEmail, aAdminId):
		"""@ParamType aUserId String
		@ParamType aUsername String
		@ParamType aEmail String
		@ParamType aAdminId String"""
		pass

	def createUserAccount(self, aUser):
		"""@ParamType aUser User
		@ReturnType void"""
		pass

	def deactivateUserAccount(self, aUserId):
		"""@ParamType aUserId String
		@ReturnType void"""
		pass

	def resetUserPassword(self, aUserId):
		"""@ParamType aUserId String
		@ReturnType void"""
		pass

	def scheduleDeadline(self, aPeriodOfPay, aDeadline):
		"""@ParamType aPeriodOfPay String
		@ParamType aDeadline Date
		@ReturnType void"""
		pass

	def updateOvertimeRate(self, aRate):
		"""@ParamType aRate double
		@ReturnType void"""
		pass

	def backupData(self):
		"""@ReturnType void"""
		pass

	def restoreData(self):
		"""@ReturnType void"""
		pass

	def runDailyReminderCheck(self):
		"""@ReturnType void"""
		pass

	def getAdminID(self):
		"""@ReturnType String"""
		return self.___adminID

	def __init__(self):
		self.___adminID = None
		"""@AttributeType String"""

