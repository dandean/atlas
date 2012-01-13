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
   * Atlas.collectionSorting(backbone) -> Backbone
   *
   * Adds three new methods to Backbone.Collection instances: `sortWith`, `sortOn` and `reverseSortOn`.
  **/
  Atlas.collectionSorting = function(Backbone) {

    /**
     * Backbone.Collection#sortWith(comparer, silent) -> Backbone.Collection
     * - comperer (Function)
     * - silent (Boolean);
     *
     * Much like the native Array#sort, this method uses the provided function to determine a collection's sort order.
    **/
    Backbone.Collection.prototype.sortWith = function(compare, silent) {
      if (!compare) return this;
      this.models = this.models.sort(compare);
      if (!silent) this.trigger('reset', this, { silent: silent });
      return this;
    };

    var createSorter = function(attribute) {
      return function(a, b) {
        var a = a[attribute], b = b[attribute];

        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        }
        return 0;
      }
    };

    /**
     * Backbone.Collection#sortOn(attribute, silent) -> Backbone.Collection
     * - attribute (String)
     * - silent (Boolean);
     *
     * Sorts the collection in the natural sort order of the specified attribute.
    **/
    Backbone.Collection.prototype.sortOn = function(attribute, silent) {
      return this.sortWith(createSorter(attribute), silent);
    };

    /**
     * Backbone.Collection#reverseSortOn(attribute, silent) -> Backbone.Collection
     * - attribute (String)
     * - silent (Boolean);
     *
     * Reverse sorts the collection in the natural sort order of the specified attribute.
    **/
    Backbone.Collection.prototype.reverseSortOn = function(attribute, silent) {
      var sorter = createSorter(attribute);
      return this.sortWith(function(a, b) {
        return -1 * sorter(a, b);
      }, silent);
    };

    return Backbone;

  };


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
    Backbone = Atlas.es5(Backbone);
    Backbone = Atlas.collectionSorting(Backbone);
    Backbone = Atlas.routerEvents(Backbone);
    return Backbone;
  };

}).call(this);
