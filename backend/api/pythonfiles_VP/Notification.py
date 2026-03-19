#!/usr/bin/python
# -*- coding: UTF-8 -*-
import NotificationType
import User

class Notification(object):
	def Notification(self, aUserId, aMessage, aType):
		"""@ParamType aUserId String
		@ParamType aMessage String
		@ParamType aType NotificationType"""
		pass

	def send(self):
		"""@ReturnType void"""
		pass

	def markAsRead(self):
		"""@ReturnType void"""
		pass

	def getNotificationId(self):
		"""@ReturnType String"""
		return self.___notificationId

	def getMessage(self):
		"""@ReturnType String"""
		return self.___message

	def getTimestamp(self):
		"""@ReturnType DateTime"""
		return self.___timestamp

	def getHasRead(self):
		"""@ReturnType Boolean"""
		return self.___hasRead

	def setHasRead(self, aHasRead):
		"""@ParamType aHasRead Boolean
		@ReturnType void"""
		self.___hasRead = aHasRead

	def getType(self):
		"""@ReturnType NotificationType"""
		return self.___type

	def __init__(self):
		self.___notificationId = None
		"""@AttributeType String"""
		self.___message = None
		"""@AttributeType String"""
		self.___timestamp = None
		"""@AttributeType DateTime"""
		self.___hasRead = None
		"""@AttributeType Boolean"""
		self.___type = None
		"""@AttributeType NotificationType"""
		self._users = []
		"""@AttributeType User*
		# @AssociationType User[]
		# @AssociationMultiplicity 1..*"""

