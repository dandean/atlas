!(function(){

  // Declare and export Atlas exactly as Backbone does.
  var root = this;
  var Atlas;
  if (typeof exports !== 'undefined') {
    Atlas = exports;
  } else {
    Atlas = root.Atlas = {};
  }

  // Import underscore exactly as Backbone does.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

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

    return Backbone;
  };

  /**
   * Atlas.routerEvents(backbone) -> Backbone
   *
   * Monkey-patches `Backbone.Router` to trigger 'before' and 'after' events.
  **/
  Atlas.routerEvents = function(Backbone) {
    var routeFn = Backbone.Router.prototype.route;
    var previousRouteInfo;

    Backbone.Router.prototype.route = function(route, name, callback) {
      // Redefine callback, maintaining scope...
      var wrapped = _.bind(function() {
        var info = { route: route, name: name };
        this.trigger('before', previousRouteInfo || {}, info);
        callback.apply(this, arguments);
        this.trigger('after', previousRouteInfo || {}, info);
        // Save new route info for next time.
        previousRouteInfo = info;
      }, this);

      // Call the original route function, but with the redefined callback.
      routeFn.call(this, route, name, wrapped);
    };

    return Backbone;
  };

  /**
   * Atlas.all(backbone) -> Backbone
   *
   * Enhances Backbone with all of Atlas' features.
  **/
  Atlas.all = function(Backbone) {
    return Atlas.es5(Atlas.routerEvents(Backbone));
  };

}).call(this);
