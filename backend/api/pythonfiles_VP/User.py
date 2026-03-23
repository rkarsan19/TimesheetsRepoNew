#!/usr/bin/python
# -*- coding: UTF-8 -*-
from abc import ABCMeta, abstractmethod
import LoginCredentials
import AuditLog
import Notification

class User(object):
	__metaclass__ = ABCMeta
	@classmethod
	def User(self, aUserId, aUserName, aEmail, aRole):
		"""@ParamType aUserId String
		@ParamType aUserName String
		@ParamType aEmail String
		@ParamType aRole Role"""
		pass

	@classmethod
	def login(self, aUserName, aPassword):
		"""@ParamType aUserName String
		@ParamType aPassword String
		@ReturnType Boolean"""
		pass

	@classmethod
	def logout(self):
		"""@ReturnType void"""
		pass

	@classmethod
	def resetPassword(self, aNewPassword):
		"""@ParamType aNewPassword String
		@ReturnType void"""
		pass

	@classmethod
	def isLocked(self):
		"""@ReturnType Boolean"""
		pass

	@classmethod
	def getUserName(self):
		"""@ReturnType String"""
		return self.___userName

	@classmethod
	def getEmail(self):
		"""@ReturnType String"""
		return self.___email

	@classmethod
	def getUserId(self):
		"""@ReturnType String"""
		pass

	@classmethod
	def updateContactDetails(self, aUserName, aEmail):
		"""@ParamType aUserName String
		@ParamType aEmail String"""
		pass

	@classmethod
	def __init__(self):
		self.___userID = None
		"""@AttributeType String"""
		self.___userName = None
		"""@AttributeType String"""
		self.___email = None
		"""@AttributeType String"""
		self.___isActive = None
		"""@AttributeType Boolean"""
		self._loginCredentials = None
		"""@AttributeType LoginCredentials
		# @AssociationType LoginCredentials
		# @AssociationMultiplicity 1"""
		self._audits = []
		"""@AttributeType AuditLog*
		# @AssociationType AuditLog[]
		# @AssociationMultiplicity 0..*"""
		self._notifications = []
		"""@AttributeType Notification*
		# @AssociationType Notification[]
		# @AssociationMultiplicity 0..*"""

