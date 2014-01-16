""" Custom viewlets
"""
from zope.component.hooks import getSite
from zope.component import queryAdapter
from zope.security import checkPermission
from plone.app.layout.viewlets import common
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from Products.CMFCore.utils import getToolByName
from eea.annotator.interfaces import IAnnotatorStorage
from eea.annotator.controlpanel.interfaces import ISettings

class Annotator(common.ViewletBase):
    """ Custom viewlet
    """
    render = ViewPageTemplateFile('../zpt/viewlet.pt')

    def __init__(self, context, request, view, manager=None):
        super(Annotator, self).__init__(context, request, view, manager)
        self._settings = None

    @property
    def settings(self):
        """ Settings
        """
        if self._settings is None:
            site = getSite()
            self._settings = queryAdapter(site, ISettings)
        return self._settings

    @property
    def userid(self):
        """ Current user id
        """
        mtool = getToolByName(self.context, 'portal_membership')
        return mtool.getAuthenticatedMember().getId()

    @property
    def username(self):
        """ Current user name
        """
        mtool = getToolByName(self.context, 'portal_membership')
        return mtool.getAuthenticatedMember().getProperty(
            'fullname', self.userid)

    @property
    def readOnly(self):
        """ Read-only inline comments?
        """
        if not checkPermission('eea.annotator.edit', self.context):
            return True

        storage = queryAdapter(self.context, IAnnotatorStorage)
        return storage.readOnly if storage else False

    @property
    def available(self):
        """ Available
        """
        if not checkPermission('eea.annotator.view', self.context):
            return False

        storage = queryAdapter(self.context, IAnnotatorStorage)
        if storage and storage.disabled:
            return False

        if self.settings.disabled(self.context):
            return False

        return True