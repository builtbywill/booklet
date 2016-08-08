/*
 * jQuery-featureSupport Plugin
 * https://github.com/cpharmston/jQuery-featureSupport
 * Version: 0.1 (12-JUN-2010)
 * (c) 2010 Chuck Harmston
 * Dual licensed under the MIT and GPL licenses.
 *
 * Some tests developed by Mark Pilgrim <http://diveintohtml5.org/everything.html>
 * @font-face test developed by Paul Irish <http://github.com/paulirish/font-face-detect>
 * Tests developed by others are subject to their original licenses. See LICENSE file for more information.
 */

(function($) {

	$.featureSupport = function(options) {
		
		var settings = $.extend({
			'cssClasses': true,
			'classElem': $('body'),
			'jsObject': true,
			'customTests': {}
		}, options);
		
		var testPrefixes = function(property, value, testValue){
			
			if(testValue === undefined) testValue = value;
			
			var prefixes = 'moz Moz ms webkit o'.split(' '); // DOM prefixes, not CSS ones
			var e = document.createElement('div');
			
			// No prefix
			e.style[property] = value;
			if(e.style.cssText.indexOf(value) !== -1) return true;
			
			// Vendor-specific prefixes
			for(var i in prefixes){
				var prefixed = prefixes[i] + property.charAt(0).toUpperCase() + property.slice(1);
				e.style[prefixed] = value;
				if(e.style.cssText.indexOf(testValue) !== -1) return true;
			}
			
			return false;
			
		};
		
		var tests = {
			
			// Tests for support of CSS animations
			// http://www.w3.org/TR/css3-animations/
			'animation': function(){
				return testPrefixes('animation', '"animate" 2s ease 2', '2s');
			},
			
			// Related to the HTML5 <audio> element
			'audio': {
				
				// Tests for support of the HTML5 <audio> element
				// http://www.w3.org/TR/html5/video.html#audio
				'element': function(){
					return !!document.createElement('audio').canPlayType;
				},
				
				// Tests for support for the MP3 file format for the HTML5 <audio> element
				// http://en.wikipedia.org/wiki/MP3
				'mp3': function(){
					var a = document.createElement('audio');
					return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
				},
				
				// Tests for support for the Vorbis file format for the HTML5 <audio> element
				// http://en.wikipedia.org/wiki/Vorbis
				'vorbis': function(){
					var a = document.createElement('audio');
					return !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
				},
				
				// Tests for support for the WAV file format for the HTML5 <audio> element
				// http://en.wikipedia.org/wiki/WAV
				'wav': function(){
					var a = document.createElement('audio');
					return !!(a.canPlayType && a.canPlayType('audio/wav; codecs="1"').replace(/no/, ''));
				},
				
				// Tests for support for the AAC file format for the HTML5 <audio> element
				// http://en.wikipedia.org/wiki/Advanced_Audio_Coding
				'aac': function(){
					var a = document.createElement('audio');
					return !!(a.canPlayType && a.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, ''));
				}
				
			},
			
			// Tests for the CSS3 border-image property
			// http://www.w3.org/TR/css3-background/#border-images
			'borderImage': function(){
				return testPrefixes('borderImage', 'url("fake.file") 1 1 stretch', 'fake.file');
			},
			
			// Tests for the CSS border-radius property
			// http://www.w3.org/TR/css3-background/#the-border-radius
			'borderRadius': function(){
				return testPrefixes('borderRadius', '5px');
			},
			
			// Tests for the CSS box-shadow property
			// http://www.w3.org/TR/css3-background/#the-box-shadow
			'boxShadow': function(){
				return testPrefixes('boxShadow', '1px 1px 1px #000', '1px');
			},
			
			// Tests for cache manifest support
			// http://www.w3.org/TR/html5/offline.html#appcache
			'cache': function(){
				return !!window.applicationCache;
			},
			
			// Related to the HTML5 <canvas> element
			'canvas': {
				
				// Tests for support of the HTML5 <canvas> element
				// http://www.w3.org/TR/html5/the-canvas-element.html
				'element': function(){
					return !!document.createElement('canvas').getContext;
				},
				
				// Tests for support of the HTML5 <canvas> text API
				// http://dev.w3.org/html5/canvas-api/canvas-2d-api.html#text
				'text': function(){
					var c = document.createElement('canvas');
					return c.getContext && typeof c.getContext('2d').fillText == 'function';
				}
				
			},
			
			// Tests for the HTML5 <command> element
			// http://www.w3.org/TR/html5/interactive-elements.html#the-details-element
			'command': function(){
				return 'type' in document.createElement('command');
			},
			
			// Tests for the contenteditable attribute
			// http://www.w3.org/TR/html5/editing.html#attr-contenteditable
			'contentEditable': function(){
				return 'isContentEditable' in document.createElement('span');
			},
			
			// Tests for the HTML5 <details> element
			// http://www.w3.org/TR/html5/interactive-elements.html#the-details-element
			'details': function(){
				return 'open' in document.createElement('details');
			},
			
			// Tests for the HTML5 <device> element
			// http://dev.w3.org/html5/html-device/
			'device': function(){
				return 'type' in document.createElement('device');
			},
			
			// Tests for client-side database support
			'db': {
				
				// Tests for WebSimpleDB support
				// http://dev.w3.org/2006/webapi/WebSimpleDB/
				'webSimpleDB': function(){
					return !!window.indexedDB;
				},
				
				// Tests for webSQLDatabase support
				// http://dev.w3.org/html5/webdatabase/
				'webSQLDatabase': function(){
					return !!window.openDatabase;
				}
				
			},
			
			// Tests for HTML5 drag-and-drop support
			// http://dev.w3.org/html5/spec/dnd.html
			'dragDrop': function(){
				return 'draggable' in document.createElement('span');
			},
			
			// Tests for support for the HTML5 File API
			// http://dev.w3.org/2006/webapi/FileAPI/
			'files': function(){
				return typeof FileReader != 'undefined';
			},
			
			// Tests for support of the CSS @font-face declaration
			// http://www.w3.org/TR/css3-fonts/
			'fontface': function(){
				
				/*!
				* isFontFaceSupported - Sniff variant - v0.9 - 12/19/2009
				* http://paulirish.com/2009/font-face-feature-detection/
				*
				* Copyright (c) 2009 Paul Irish
				* MIT license
				*/
				
				/*
				Browser sniffing is bad. You should use feature detection.
				Sadly the only feature detect for @font-face is
				asynchronous. So for those that *need* a synchronous solution,
				here is a sniff-based result:
				*/
				
				var ua = navigator.userAgent, parsed;
				
				if (/*@cc_on@if(@_jscript_version>=5)!@end@*/0)
					return true;
				if (parsed = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/))
					return parsed[1] >= '4.0.249.4';
				if ((parsed = ua.match(/Safari\/(\d+\.\d+)/)) && !/iPhone/.test(ua))
					return parsed[1] >= '525.13';
				if (/Opera/.test({}.toString.call(window.opera)))
					return opera.version() >= '10.00';
				if (parsed = ua.match(/rv:(\d+\.\d+\.\d+)[^b].*Gecko\//))
					return parsed[1] >= '1.9.1';
					
				return false;
				
			},
			
			// Tests for HTML5 form-related features
			'form': {
				
				// Tests for new <input> attributes
				'attribute': {
					
					// Tests for the autofocus attribute for form elements
					// http://dev.w3.org/html5/spec/association-of-controls-and-forms.html#autofocusing-a-form-control
					'autofocus': function(){
						return 'autofocus' in document.createElement('input');
					},
					
					// Tests for the placeholder attribute for form elements
					// http://dev.w3.org/html5/spec-author-view/common-input-element-attributes.html#the-placeholder-attribute
					'placeholder': function(){
						return 'placeholder' in document.createElement('input');
					}
					
				},
				
				// Tests for the constraint validation API
				// http://www.w3.org/TR/html5/forms.html#the-constraint-validation-api
				'constraintValidation': function(){
					return 'noValidate' in document.createElement('form');
				},
				
				// Tests for the HTML5 <datalist> element
				// http://dev.w3.org/html5/spec-author-view/the-button-element.html#the-datalist-element
				'datalist': function(){
					return 'options' in document.createElement('datalist');
				},
				
				// Tests for new <input> types
				'type': {
					
					// http://www.w3.org/TR/html5/forms.html#color-state
					'color': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'color');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#date-state
					'date': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'date');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#date-and-time-state
					'datetime': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'datetime');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#local-date-and-time-state
					'datetimeLocal': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'datetime-local');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#e-mail-state
					'email': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'email');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#month-state
					'month': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'month');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#number-state
					'number': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'number');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#range-state
					'range': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'range');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#text-state-and-search-state
					'search': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'search');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#telephone-state
					'tel': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'tel');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#time-state
					'time': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'time');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#url-state
					'url': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'url');
						return i.type !== 'text';
					},
					
					// http://www.w3.org/TR/html5/forms.html#week-state
					'week': function(){
						var i = document.createElement('input');
						i.setAttribute('type', 'week');
						return i.type !== 'text';
					}
					
				}
				
			},
			
			// Tests for HTML5 geolocation support
			// http://www.w3.org/TR/geolocation-API/
			'geolocation': function(){
				return !!navigator.geolocation;
			},
			
			// Tests for CSS gradient support
			'gradients': {
				
				// Tests for the Mozilla syntax of CSS graduent
				// https://developer.mozilla.org/en/CSS/-moz-linear-gradient
				'mozilla': function(){
					return testPrefixes('background', '-moz-linear-gradient(center bottom, #FFF 0%, #000 100%)', 'gradient');
				},
				
				// Tests for the WebKit syntax of CSS gradient
				// http://webkit.org/blog/175/introducing-css-gradients/
				'webkit': function(){
					return testPrefixes('background', '-webkit-gradient(linear, left bottom, left top, color-stop(0, #FFF), color-stop(1, #000))', 'gradient');
				},
				
				// Tests for support for any flavor of CSS gradient (currently only WebKit or Mozilla syntax)
				'any': function(){
					return (this.mozilla() || this.webkit());
				}
				
			},
			
			// Tests for joint session history support
			// http://www.w3.org/TR/2009/WD-html5-20090825/history.html
			'history': function(){
				return !!(window.history && window.history.pushState && window.history.popState);
			},
			
			// Tests for support of the CSS hsla color constructor
			// http://www.w3.org/TR/css3-color/#hsla-color
			'hsla': function(){
				var e = document.createElement('div');
				e.style.cssText = 'background-color:hsla(0,0%,0%,0.1)';
				return (e.style.backgroundColor.indexOf('rgba') !== -1) ||( e.style.backgroundColor.indexOf('hsla') !== -1);
			},
			
			// Tests for new features related to the <iframe> element
			// http://dev.w3.org/html5/spec/Overview.html#the-iframe-element
			'iframe': {
				
				// Tests for the sandbox attribute
				// http://dev.w3.org/html5/spec-author-view/the-iframe-element.html#attr-iframe-sandbox
				'sandbox': function(){
					return 'sandbox' in document.createElement('iframe');
				},
				
				// Tests for the srcdoc attribute
				// http://dev.w3.org/html5/spec-author-view/the-iframe-element.html#attr-iframe-srcdoc
				'srcdoc': function(){
					return 'srcdoc' in document.createElement('iframe');
				}
				
			},
			
			// Tests for cross-document messaging support
			// http://dev.w3.org/html5/postmsg/
			'messaging': function(){
				return !!window.postMessage;
			},
			
			// Tests for the HTML5 <meter> element
			// http://www.w3.org/TR/html5/forms.html#the-meter-element
			'meter': function(){
				return 'value' in document.createElement('meter');
			},
			
			// Tests for microdata support
			// http://www.w3.org/TR/html5/microdata.html
			'microdata': function(){
				return !!document.getItems;
			},
			
			// Tests for CSS multiple background image support
			// http://www.w3.org/TR/css3-background/#layering
			'multibg': function(){
				var e = document.createElement('div');
				e.style.cssText = 'background:url("fake.file"), url("file.fake"), #00F url("fake.fake")';
				return e.style.backgroundImage.match(/url\(/g).length == 3;
			},
			
			// Tests for the CSS opacity property
			// http://www.w3.org/TR/css3-color/#transparency
			'opacity': function(){
				return testPrefixes('opacity', '0.5');
			},
			
			// Tests for the HTML5 <output> element
			// http://www.w3.org/TR/html5/forms.html#the-output-element
			'output': function(){
				return 'value' in document.createElement('output');
			},
			
			// Tests for support of the CSS position:fixed property
			// http://www.w3.org/TR/CSS2/visuren.html#fixed-positioning
			'positionFixed': function(){
				var e = document.createElement('div');
				var b = document.body;
				e.style.position = 'static'; 
				e.style.bottom = '0px'; 
				b.appendChild(e); 
				var o = e.offsetTop;
				var r = false;
				try{ 
					e.style.position = 'fixed'; 
					if(o && typeof e.offsetTop == 'number') var r = (o != e.offsetTop); 
				}catch(er){} 
				b.removeChild(e); 
				return r;
			},
			
			// Tests for the HTML5 <progress> element
			// http://www.w3.org/TR/html5/forms.html#the-progress-element
			'progress': function(){
				return 'value' in document.createElement('progress');
			},
			
			// Tests for support of the CSS rgba color constructor
			// http://www.w3.org/TR/css3-color/#rgba-color
			'rgba': function(){
				var e = document.createElement('div');
				e.style.cssText = 'background-color:rgba(0,0,0,0.1)';
				return e.style.backgroundColor.indexOf('rgba') !== -1;
			},
			
			// Tests for server-sent event support
			// http://dev.w3.org/html5/eventsource/
			'serverSentEvents': function(){
				return typeof EventSource !== 'undefined';
			},
			
			// Related to the webstorage specification
			// http://dev.w3.org/html5/webstorage/
			'storage': {
				
				// Tests for local storage support
				// http://dev.w3.org/html5/webstorage/#the-localstorage-attribute
				'local': function(){
					return !!window.localStorage;
				},
				
				// Tests for session storage support
				// http://dev.w3.org/html5/webstorage/#the-sessionstorage-attribute
				'session': function(){
					try {
						return ('sessionStorage' in window) && window['sessionStorage'] !== null;
					} catch(e) {
						return false;
					}
				}
				
			},
			
			// Related to SVG
			// http://www.w3.org/Graphics/SVG/
			'svg': {
				
				// Support for SVG served from external files
				// http://www.w3.org/TR/SVG/
				'external': function(){
					return !!(document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);
				},
				
				// Support for the <svg> element
				// http://hacks.mozilla.org/2010/05/firefox-4-the-html5-parser-inline-svg-speed-and-more/
				'inline': function(){
					var e = document.createElement('div');
					e.innerHTML = '<svg></svg>';
					return !!(window.SVGSVGElement && e.firstChild instanceof window.SVGSVGElement);
				}
				
			},
			
			// Tests for the HTML5 <time> element
			// http://dev.w3.org/html5/spec/Overview.html#the-time-element
			'time': function(){
				return 'valueAsDate' in document.createElement('time');
			},
			
			// Tests for touch-related events
			// http://developer.apple.com/iphone/library/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/EventHandling/EventHandling.html
			'touch': function(){
				return !!('ontouchstart' in window);
			},
			
			// Related to CSS transform support
			'transform': {
				
				// Tests for CSS 2D transform support
				// http://www.w3.org/TR/css3-2d-transforms/
				'twoDimensions': function(){
					return testPrefixes('transform', 'translate(1px, 1px)');
				},
				
				// Tests for CSS 3D transform support
				// http://www.w3.org/TR/css3-3d-transforms
				'threeDimensions': function(){
					return testPrefixes('transform', 'rotateY(1deg)');
				}
				
			},
			
			// Tests for CSS transition support
			// http://www.w3.org/TR/css3-transitions/
			'transition': function(){
				return testPrefixes('transition', 'all 0.5s ease-in', 'all');
			},
			
			// Tests for undo management support
			// http://www.w3.org/TR/2008/WD-html5-20080122/#undo
			'undo': function(){
				return typeof UndoManager !== 'undefined';
			},
			
			// Related to the HTML5 <video> element
			'video': {
				
				// Tests for support for <video> captions
				// http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#websrt
				'captions': function(){
					return 'track' in document.createElement('track');
				},
				
				// Tests for support of the HTML5 <video> element
				// http://www.w3.org/TR/html5/video.html
				'element': function(){
					return !!document.createElement('video').canPlayType;
				},
				
				// Tests for support of the H.264 codec for the HTML5 <video> element
				// http://en.wikipedia.org/wiki/H.264/MPEG-4_AVC
				'h264': function(){
					var v = document.createElement('video');
					return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
				},
				
				// Tests for support for the Ogg Theora codec for the HTML5 <video> element
				// http://en.wikipedia.org/wiki/Theoraw3
				'ogg': function(){
					var v = document.createElement('video');
					return !!(v.canPlayType && v.canPlayType('video/ogg; codecs="theora, vorbis"').replace(/no/, ''));
				},
				
				// Tests for support for the poster attribute
				// http://www.w3.org/TR/html5/video.html#attr-video-poster
				'poster': function(){
					return 'poster' in document.createElement('video');
				},
				
				// Tests for support for the WebM codecs for the HTML5 <video> element
				// http://en.wikipedia.org/wiki/WebM
				'webm': function(){
					var v = document.createElement('video');
					return !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''));
				}
				
			},
			
			// Tests for WebSocket support
			// http://www.w3.org/TR/websockets/
			'websockets': function(){
				return !!window.WebSocket;
			},
			
			// Tests for Web Worker support
			// http://dev.w3.org/html5/workers/
			'webWorker': function(){
				return !!window.Worker;
			}
			
		};
		
		var runTests = function(object, parentName){
			var results = {};
			if(parentName === undefined) var parentName = '';
			for(var i in object){
				if(typeof object[i] == 'function'){
					var t = object[i]();
					if(settings['cssClasses']){
						var className = (((t) ? '' : 'no-') + parentName + i).toLowerCase();
						settings['classElem'].addClass(className);
					}
					results[i] = t;
				}else{
					results[i] = runTests(object[i], parentName + i + '-');
				}
			}
			return results
		};
		
		$.extend(tests, settings['customTests']);
		var ret = runTests(tests);
		if(settings['jsObject']) window.featureSupport = ret;
		return ret;
	
	};

})(jQuery);