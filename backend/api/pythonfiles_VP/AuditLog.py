#!/usr/bin/python
# -*- coding: UTF-8 -*-
import User

class AuditLog(object):
	def AuditLog(self, aUserId, aAction):
		"""@ParamType aUserId String
		@ParamType aAction String"""
		pass

	def recordAction(self, aUserId, aAction):
		"""@ParamType aUserId String
		@ParamType aAction String
		@ReturnType void"""
		pass

	def getAudit(self):
		"""@ReturnType String"""
		pass

	def getTimestamp(self):
		"""@ReturnType DateTime"""
		return self.___timestamp

	def getUserId(self):
		"""@ReturnType String"""
		pass

	def __init__(self):
		self.___auditID = None
		"""@AttributeType String"""
		self.___action = None
		"""@AttributeType String"""
		self.___timestamp = None
		"""@AttributeType DateTime"""
		self._user = None
		"""@AttributeType User
		# @AssociationType User
		# @AssociationMultiplicity 1"""

