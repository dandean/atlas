Atlas (for Backbone.js)
=======================

Atlas sits on top of Backbone.js, adding features and making it nicer to use.

ES5 getters/setters
-------------------

Atlas adds ES5 getters and setters to `Backbone.Model` for every default attribute. 

```js
var User = Backbone.Model.extend({
  defaults: {
    username: undefined,
    email: undefined
  }
});
      
var user = new User();
      
// Backbone's API:
user.set({ 'username':'dandean' });
      
// Backbone with Atlas:
user.username = 'dandean';
```


Router Events
-----------------

Atlas triggers events before and after routes are executed. These events can do awesome things like notify your views that they should go ahead and remove themselves from the DOM.

Events: "before", "after". Event handlers are passed two arguments, `from` and `to`, which are both objects in the form of:

```js
{
  route: 'some/route/:path',
  name: 'routeName'
}
```

Example:

```js
var router = Backbone.Router.extend({
  routes: {
    '' : 'index',
    'library': 'library',
    'library/work': 'work',
  },
        
  ...

  library: function() {
    var collectionsView = new App.Views.Library.Collections();
    $('body').append(collectionsView.el);
    
    var worksView = new App.Views.Library.Works();
    $('body').append(worksView.el);

    var navigateHandler = function(from, to) {
      if (from.name === 'library') {
        Backbone.history.unbind('willNavigate', navigateHandler);
        collectionsView.remove();
        worksView.remove();
      }
    };
    
    this.bind("before", navigateHandler);
  },
        
  ...
        
});
```


Experimental!
-------------

Atlas is still experimental, and the fact that it monkey-patches Backbone is a bit iffy... but it's awesome so you should totally use it.


What's with the cheesy name, Atlas?
-----------------------------------

The topmost vertibra in a backbone is named "atlas"... now you know.


Licences
--------

**MIT!**
