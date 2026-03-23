#!/usr/bin/python
# -*- coding: UTF-8 -*-
import User

class LoginCredentials(object):
	def LoginCredentials(self, aUserId, aPasswordHash):
		"""@ParamType aUserId String
		@ParamType aPasswordHash String"""
		pass

	def validateCredentials(self, aPassword):
		"""@ParamType aPassword String
		@ReturnType Boolean"""
		pass

	def incrementAttemptsFailed(self):
		"""@ReturnType void"""
		pass

	def lockAccount(self):
		"""@ReturnType void"""
		pass

	def isLockedOut(self):
		"""@ReturnType Boolean"""
		pass

	def getLastLoginDate(self):
		"""@ReturnType Date"""
		return self.___lastLoginDate

	def setLastLoginDate(self, aLastLoginDate):
		"""@ParamType aLastLoginDate Date
		@ReturnType void"""
		self.___lastLoginDate = aLastLoginDate

	def resetPassword(self, aNewPasswordHash):
		"""@ParamType aNewPasswordHash String
		@ReturnType void"""
		pass

	def incrementFailedAttempts(self):
		"""@ReturnType void"""
		pass

	def __init__(self):
		self.___passwordHash = None
		"""@AttributeType String"""
		self.___failedLoginAttempts = None
		"""@AttributeType int"""
		self.___lockoutExpiry = None
		"""@AttributeType DateTime"""
		self.___lastLoginDate = None
		"""@AttributeType Date"""
		self._user = None
		"""@AttributeType User
		# @AssociationType User
		# @AssociationMultiplicity 1"""

