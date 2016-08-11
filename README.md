# jQuery Booklet Plugin

Booklet is a jQuery tool for displaying content on the web in a flipbook layout.
It was built using the jQuery library. Licensed under both MIT and GPL licenses.

For detailed documentation and information, visit http://www.builtbywill.com/booklet/.
Below is some basic information to get you started.

## Installation

To install jQuery Booklet into your webpage, first include jQuery, jQuery UI (optional), jQuery Easing
and the booklet CSS and JS files.

``` html
// CSS
<link href="booklet/jquery.booklet.latest.css" type="text/css" rel="stylesheet" media="screen, projection, tv" />
```

``` html
// jQuery
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js"></script>
<script> window.jQuery || document.write('<script src="booklet/jquery-2.1.0.min.js"><\/script>') </script>

// jQuery UI (optional)
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js"></script>
<script> window.jQuery.ui || document.write('<script src="booklet/jquery-ui-1.10.4.min.js"><\/script>') </script>

// Booklet
<script src="booklet/jquery.easing.1.3.js" type="text/javascript"></script>
<script src="booklet/jquery.booklet.latest.min.js" type="text/javascript"></script>
```
The target that will become your booklet should simply be a container with multiple children. All first level children will become
pages inside of the booklet.

``` html
<div id="mybook">
	<div>
		<h3>Yay, Page 1!</h3>
	</div>
	<div>
		<h3>Yay, Page 2!</h3>
	</div>
	<div>
		<h3>Yay, Page 3!</h3>
	</div>
	<div>
		<h3>Yay, Page 4!</h3>
	</div>
</div>
```

Once you have the files included and the structure created, you can initialize the booklet.

``` javascript
$(function() {
	//single book
	$('#mybook').booklet();

	//multiple books with ID's
	$('#mybook1, #mybook2').booklet();

	//multiple books with a class
	$('.mycustombooks').booklet();
});
```
## Documentation
### Options

Options can be set either with an init object, or afterwards with a setter function. Also, you can get the value of an option
as well. To see all available options, see the [Documentation](http://www.builtbywill.com/booklet/#/documentation)

``` javascript
//init
$(".selector").booklet({ width: 500 });

//getter
var width = $(".selector").booklet("option", "width");

//setter
$(".selector").booklet("option", "width", 600);
```

## Events

The following events are triggered when using a booklet.

* bookletcreate
* bookletstart, bookletchange
* bookletadd, bookletremove

Each event returns a data object which contains data related to the event. Common to all events are:

* data.options - the current booklet options at time of the event (read-only)
* data.index - zero-based index of the currently visible page spread

Only available for bookletcreate, bookletstart and bookletchange events:

* data.pages - an array of elements, the two currently visible pages

Only available for bookletadd and bookletremove events:

* data.page - element, the page that was either just added or just removed

You can bind your callbacks to events either at init, or using the event type.
To see all available events, see the [Documentation](http://www.builtbywill.com/booklet/#/documentation)

``` javascript
//init
$(".selector").booklet({
	create: function(event, data) { ... }
});

//event type
$(".selector").bind("bookletcreate", function(event, data) {
	...
});
```

## Methods
The methods available for each booklet can be called on one or more booklets at the same time.
Methods which return a value, such as an option, when called on more than one selector will return an array of values.
Otherwise, the chainability of the elements will be maintained.

``` javascript
//destroys the booklet
$(".selector").booklet("destroy");

// get a single returned option
var val = $("#selector").booklet("option", "width");

// get an array of returned options (for multiple booklets)
var val = $(".selector, .selector2").booklet("option", "width");
```

To see all available methods, see the [Documentation](http://www.builtbywill.com/booklet/#/documentation)

## Style

Once the booklet is created, the basic generated structure and CSS will appear below.

If more customization is desired, all generated classes are visible in the current jQuery Booklet stylesheet.

``` html
<div class="booklet" id="mybook">
    <div class="b-page b-page-0 b-p1">
        <div class="b-wrap b-wrap-left">
            ...
        </div>
    </div>
    <div class="b-page b-page-1 b-p2">
        <div class="b-wrap b-wrap-right">
            ...
        </div>
    </div>
    <div class="b-page b-page-2 b-p3">
        <div class="b-wrap b-wrap-left">
            ...
        </div>
    </div>
    <div class="b-page b-page-3 b-p4">
        <div class="b-wrap b-wrap-right">
            ...
        </div>
    </div>
    <div class="b-controls">
        ...
    </div>
</div>
```
