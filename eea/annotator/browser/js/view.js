if(!jQuery.fn.addBack){
  jQuery.fn.addBack = jQuery.fn.andSelf;
}

if(window.EEA === undefined){
  var EEA = {
    who: 'eea.annotator',
    version: '1.0'
  };
}

EEA.Annotator = function(context, options){
  var self = this;
  self.context = context;
  self.target = jQuery('#content');

  self.settings = {
    readOnly: self.context.data('readonly') || 0,
    prefix: '',
    user: {
      id: 'anonymous',
      name: 'Anonymous'
    },
    urls: {
      create:  '/annotations_edit',
      read:    '/annotations_view/:id',
      update:  '/annotations_edit/:id',
      destroy: '/annotations_edit/:id',
      search:  '/annotations_search'
    }
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

EEA.Annotator.prototype = {
  initialize: function(){
    var self = this;
    self.button = self.context.find('.annotator-button');
    self.button.attr('title', self.button.data('hide'));
    self.enabled = true;

    self.button.click(function(evt){
      evt.preventDefault();
      return self.click();
    });

    self.reload();
  },

  click: function(){
    var self = this;
    if(self.enabled){
      self.enabled = false;
      self.button.addClass('annotator-disabled');
      self.button.attr('title', self.button.data('show'));
      self.target.annotator('destroy');
    }else{
      self.enabled = true;
      self.button.removeClass('annotator-disabled');
      self.button.attr('title', self.button.data('hide'));
      self.reload();
    }
  },

  reload: function(){
    var self = this;

    // Init annotator
    self.target.annotator({
      readOnly: Boolean(self.settings.readOnly),
      exactMatch: true
    });

    // Add comment date
    self.target.annotator('addField', {
      load: function(field, annotation){
        var published = new Date(annotation.updated || annotation.created);
        var dateString = Util.dateString(published);
        $(field)
          .html(dateString)
          .addClass('annotator-date')
          .attr('title', published.toDateString());
      }
    });
    // Permissions plugin
    self.target.annotator('addPlugin', 'Permissions', {
      user: self.settings.user,
      userId: function(user){
        if(user && user.id){
          return user.id;
        }
        return user;
      },
      userString: function(user){
        return Util.userString(user);
      },
      showViewPermissionsCheckbox: false,
      showEditPermissionsCheckbox: false
    });

    // // Reply plugin
    self.target.annotator('addPlugin', 'Comment');

    // Storage plugin
    self.target.annotator('addPlugin', 'Store', {
      prefix: self.settings.prefix,
      urls: self.settings.urls
    });

    // Errata plugin
    self.target.annotator('addPlugin', 'Errata');

  }
};


jQuery.fn.EEAAnnotator = function(options){
  return this.each(function(){
    var context = jQuery(this);
    var adapter = new EEA.Annotator(context, options);
    context.data('EEAAnnotator', adapter);
  });
};


// EEA Annotator Portlet
EEA.AnnotatorPortlet = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {

  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

EEA.AnnotatorPortlet.prototype = {
  initialize: function(){
    var self = this;
    self.header = self.context.find('.portletHeader');
    self.parent = self.context.parent();
    self.width = self.context.width();

    self.context.find('.annotator-errata').off('.AnnotatorPortlet');
    self.context.find('.annotator-errata').on('beforeClick.AnnotatorPortlet', function(evt, data){
      if(self.context.hasClass('fullscreen')){
        return self.highlight(data.annotation, data.element);
      }else{
        return self.fullscreen(data.annotation, data.element);
      }
    });

    // Fullscreen button
    jQuery('<div>')
      .attr('title', 'Toggle Full Screen Mode')
      .addClass('annotator-fullscreen-button')
      .prependTo(self.header);

    self.header.find('.annotator-fullscreen-button,a').click(function(evt){
      evt.preventDefault();
      self.fullscreen();
    });
  },

  fullscreen: function(annotation, element){
    var self = this;

    if(self.context.hasClass('fullscreen')){
      self.context.slideUp(function(){
        self.context.removeClass('fullscreen');
        self.context.width('auto');
        self.context.slideDown('fast');
      });
    }else{
      self.context.slideUp(function(){
        self.context.addClass('fullscreen');
        self.context.width(self.width);
        self.context.slideDown('fast');
        self.highlight(annotation, element);
        if(element && element.position){
          var scrollTop = element.position().top;
          self.context.animate({
            scrollTop: scrollTop
          });
        }
      });
    }
  },

  highlight: function(annotation, element){
    var self = this;
    var highlights = [];
    if(annotation && annotation.highlights){
      highlights = annotation.highlights;
    }
    jQuery('.annotator-hl').removeClass('hover');
    jQuery.each(highlights, function(idx, highlight){
      if(idx === 0){
        var scrollTop = jQuery(highlight).position().top;
        jQuery('html,body').animate({
          scrollTop: scrollTop
        });
      }
      jQuery(highlight).addClass('hover');
    });
  }
};

jQuery.fn.EEAAnnotatorPortlet = function(options){
  return this.each(function(){
    var context = jQuery(this);
    var adapter = new EEA.AnnotatorPortlet(context, options);
    context.data('EEAAnnotatorPortlet', adapter);
  });
};


jQuery(document).ready(function(){

  // Annotator
  var items = jQuery(".eea-annotator");
  if(items.length){
    var userid = items.data('userid') || 'anonymous';
    var username = items.data('username') || userid;
    var settings = {
      prefix: jQuery('base').attr('href') + '/annotator.api',
      user: {
        id: userid,
        name: username
      }
    };

    items.EEAAnnotator(settings);
  }

  // Annotator Portlet
  items = jQuery('.annotator-portlet');
  if(items.length){
    items.EEAAnnotatorPortlet();
  }

});
