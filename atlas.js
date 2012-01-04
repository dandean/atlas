(function(){
  var root = this;

  var Atlas;

  if (typeof exports !== 'undefined') {
    Atlas = exports;

  } else {
    Atlas = root.Atlas = {};
  }
  
  /**
   * Atlas.es5(backbone) -> Backbone
   *
   * Adds ES5 getters and setters to instances of `Backbone.Model`.
  **/
  Atlas.es5 = function(Backbone) {
    /**
     * Monkey patch `Backbone.Model.extend()` with ES5 getters/setters for each
     * attribute defined in the defaults. Gives you the added bonus of being
     * to pass your backbone models directly to your Mustache.js views.
     *
     * Example:
     *
     * var User = Backbone.Model.extend({
     *   defaults: {
     *     username: undefined,
     *     email: undefined
     *   }
     * });
     * 
     * // Now, instead of `user.set(...)`, we can user attribute names at properties:
     * var user = new User();
     * user.username = "dandean"
     * user.email = "punch@face.com"
     * 
     * JSON.stringify(user);
     * // -> "{"username":"dandean","email":"punch@face.com"}"
    **/

    // Store original Backbone.Model.extend for later use...
    var originalBackboneModelExtend = Backbone.Model.extend;

    // Define a NEW Backbone.Model.extend which will place getters and setters
    // for each of our defaults on the model instance prototype...
    Backbone.Model.extend = function(parent, protoProps, staticProps) {
      // Call the original extend method...
      var child = originalBackboneModelExtend.call(Backbone.Model, parent, protoProps, staticProps);
  
      // Swap arguments, if parent wasn't provided...
      if (parent instanceof Backbone.Model === false) {
        protoProps = parent;
      }

      // If defaults are provided...
      if ('defaults' in protoProps) {
        Object.keys(protoProps.defaults).forEach(function(name) {
          // Unless the property is id...
          if (name != 'id') {
            // Create the getters and setters for the property...
            Object.defineProperty(child.prototype, name, {
              // Getter proxies to Model#get()...
              get: function() { return this.get(name); },
              // Setter proxies to Model#set(attributes)
              set: function(value) {
                var data = {};
                data[name] = value;
                this.set(data);
              },
              // Make it configurable and enumerable so it's easy to override...
              configurable: true,
              enumerable: true
            });
        
          }
        });
      }

      // Return the new Model, now with getters and setters for each property!
      return child;
    };

    // Add events to Backbone.History so it can trigger "willNavigate" and "didNavigate".
    for (var prop in Backbone.Events) {
      if (Backbone.Events[prop] !== undefined) {
        Backbone.History.prototype[prop] = Backbone.Events[prop];
      }
    }
    
    return Backbone;
  };

  /**
   * Atlas.navigation(backbone) -> Backbone
   *
   * Monkey-patches `Backbone.History` to trigger 'will-navigate' and 'did-navigate' events.
  **/
  Atlas.navigation = function(Backbone) {
    /**
     * Monkey path `Backbone.History#loadUrl so that it fires `willNavigate` and
     * `didNavigate` events.
    **/
    var preNavigateFragment;
    var navigate = Backbone.History.prototype.navigate;
    Backbone.History.prototype.navigate = function() {
      preNavigateFragment = this.getFragment();
      navigate.apply(this, arguments);
    };

    /**
     * Monkey path `Backbone.History#loadUrl so that it fires `willNavigate` and
     * `didNavigate` events.
    **/
    var loadUrl = Backbone.History.prototype.loadUrl;
    Backbone.History.prototype.loadUrl = function(path) {
  
      if (typeof path == 'undefined') {
        // `path` will be undefined when `loadUrl` is invoked from the back/forward buttons. In
        // this case, the back button has already updated the URL, so use backbone's
        // `getFragment` method to figure out our destination path.
        path = this.getFragment();
      }
  
      // `preNavigateFragment` is set from Backbone.History#navigate, which saves a reference to
      // the current fragment before updating it. When `loadUrl` is invoked from back/forward
      // buttons, preNavigateFragment will be `undefined`, but Backbone.History#fragment still
      // contains a reference to where we're coming from.
      var from = preNavigateFragment || this.fragment;
  
      // `to` is where we're going. Normalize the path to removing leading/trailing slashes
      var to = (path || '').replace(/^\/|\/$/g, '');

      // Unset so that it's only used once.
      preNavigateFragment = undefined;

      // Assume we're navigating and fire all handlers.
      this.trigger("willNavigate", from, to);

      // `loadUrl` returns `true` or `false` based on if it could find a route or not. When it
      // does, trigger the "didNavigate" event.
      if (loadUrl.call(this, to)) {
        this.trigger("didNavigate", from, to);
        return true;
      }

      this.trigger("didNotNavigate", from, to);
      return false;
    };

    return Backbone;
  };

  /**
   * Atlas.all(backbone) -> Backbone
   *
   * Enhances Backbone with all of Atlas' features.
  **/
  Atlas.all = function(Backbone) {
    return Atlas.es5(Atlas.navigation(Backbone));
  };

}).call(this);
