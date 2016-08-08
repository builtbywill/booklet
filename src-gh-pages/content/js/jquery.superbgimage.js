/**
 * --------------------------------------------------------------------
 * jQuery-Plugin SuperBGimage - Scaling Fullscreen Backgrounds and Slideshow using jQuery
 * Version: 1.0, 29.08.2009
 *
 * by Andreas Eberhard, andreas.eberhard@gmail.com
 *                      http://dev.andreaseberhard.de/projects/superbgimage/
 *
 * Copyright (c) 2009 Andreas Eberhard
 * licensed under a Creative Commons Attribution 3.0
 *
 *  Inspired by 
 *	  Supersized - Fullscreen Slideshow jQuery Plugin
 *    http://buildinternet.com/project/supersized/
 *	  By Sam Dunn (www.buildinternet.com // www.onemightyroar.com)
 * --------------------------------------------------------------------
 * License:
 * http://creativecommons.org/licenses/by/3.0/
 * http://creativecommons.org/licenses/by/3.0/deed.de
 *
 * You are free:
 *       * to Share - to copy, distribute and transmit the work
 *       * to Remix - to adapt the work
 *
 * Under the following conditions:
 *       * Attribution. You must attribute the work in the manner specified
 *         by the author or licensor (but not in any way that suggests that
 *         they endorse you or your use of the work).
 * --------------------------------------------------------------------
 * Changelog:
 *    29.08.2009 initial Version 1.0
 * --------------------------------------------------------------------
 */
 
;(function($) {

$.fn.superbgimage = function(options) {
		
		// plugin-options
		var o = $.extend({}, $.fn.superbgimage.defaults, options);
		
		return $(this).each(function()
		{
			var obj, config;
			config = $.extend(true, {}, o);
			obj = new newsuperbgimage($(this), config);
		});	
};
	
function newsuperbgimage(target, options){	

/////////////////////////////////////////////////////////////////////////
// VARS + GENERAL SETTINGS
/////////////////////////////////////////////////////////////////////////

	var self, opts, ctrls;
	
	self = this;
	opts = options;
	
	opts.superbg_inAnimation     = false;
	opts.superbg_slideshowActive = false;
	opts.superbg_imgIndex        = 1;
	opts.superbg_imgActual       = 1;
	opts.superbg_imgLast         = -1;
	opts.superbg_imgSlide        = 0;
	opts.superbg_interval        = 0;
	opts.superbg_preload         = 0;
	opts.superbg_direction       = 0;
	opts.superbg_max_randomtrans = 7;
	opts.superbg_lasttrans       = -1;
	opts.superbg_isIE6           = false;
	opts.superbg_firstLoaded     = false;
	opts.superbg_saveId          = target.attr('id');
	
	// control links option
	if(opts.controls_id){
		ctrls = $('#' + opts.controls_id);
		// add rel-attribute with index to all links
		ctrls.children('a').each(function() {
			// add click-event to links, add class for preload
			$(this)
				.attr('rel', opts.superbg_imgIndex++)
				.click(function() {
					superbgShowImage(null, link);
					return false;
				})
				.addClass('preload');
		});
		// fix total counter
		opts.superbg_imgIndex--; 
	}
	
	opts.ctrls = ctrls;
	target.data('opts',opts);

	// set required css options
	target.css({'display':'none','overflow':'hidden','z-index':opts.z_index});
	// set required css options for fullscreen mode
	if (opts.inlineMode === 0) {
		target.css({'position':'fixed','width':'100%','height':'100%','top':0,'left':0});
	}

	// reload true? remove all images
	if (opts.reload) {
		target.find('img').remove();
	}

	// hide all images, set position absolute
	target.find('img').hide().css('position','absolute'); 
	// add rel-attribute with index to all existing images
	target.find('img').each(function() {
		$(this).attr('rel', opts.superbg_imgIndex++);
		// clear title-attribute
		if (!opts.showtitle) { 
			$(this).attr('title', '');
		}
	});

	// bind load-event to show 1st image on document load
	$(window).bind('load', function() {
		superbgLoad();
	});
	
	// bind resize-event to resize actual image
	$(window).bind('resize', function() {
		superbgResize();
	});

	// fix for IE6
	superbg_isIE6 = /msie|MSIE 6/.test(navigator.userAgent);
	if (superbg_isIE6 && (opts.inlineMode === 0)) {
		target.css('position','absolute').width($(window).width()).height($(window).height());
		$(window).bind('scroll', function() {
			superbgScrollIE6();
		});
	}
	
	// reload true? show new image-set
	if (opts.reload) {
		superbgLoad();
	}
	
	
	
/////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////
	
	// fix for IE6, handle scrolling-event
	function superbgScrollIE6(){
		// set top of the container
		target.css('top', document.documentElement.scrollTop + 'px');
	};
	
	// handle load-event, show 1st image
	function superbgLoad(){
		
		// show container only if images/links exist
		if (target.children('img').length > 0 || ctrls.children('a').length > 0){
			target.show();
		}
		
		// 1st image to display set in options?
		if (typeof opts.showimage != 'undefined' && opts.showimage >= 0) {
			opts.superbg_imgActual = opts.showimage;
		}
	
		// display random image?
		if (opts.randomimage === 1) {
			opts.superbg_imgActual = (1 + parseInt(Math.random() * (opts.superbg_imgIndex - 1 + 1), 10));
		}
		
		// display 1st image
		superbgShowImage(opts.superbg_imgActual);
	
	};
	
	// timer-function for preloading images
	function superbgimagePreload() {	
	
		// clear timer
		clearInterval(opts.superbg_preload);
	
		// preload only if first image is loaded and linked images exist
		if (!opts.superbg_firstLoaded && ctrls.children('a').length > 0) {
			opts.superbg_preload = setInterval("superbgimagePreload()", 111);
			return;
		}
	
		// get first image that is not loaded
		ctrls.children('a.preload:first').each(function() {
	
			// get image index and title
			var imgrel   = $(this).attr('rel');
			var imgtitle = $(this).attr('title');
			var img      = new Image();
			
			// preload image, set rel and title, prepend image to container, remove preload class
			$(img).load(function() {
				$(this).css('position', 'absolute').hide();
				if (target.children('img' + "[rel='" + imgrel + "']").length === 0) {
					$(this).attr('rel', imgrel);
					if (opts.showtitle === 1) {
						$(this).attr('title', imgtitle);
					}	
					target.prepend(this);
				}					
				img.onload=function(){};
			}).error(function() {
				img.onerror=function(){};
			}).attr('src', $(this).attr('href'));
			
			// set timer to preload next image
			opts.superbg_preload = setInterval("superbgimagePreload()", 111);
	
		}).removeClass('preload');
		
	};
			
	// handle resize-event, resize active image
	function superbgResize() {	
	
		// get active image
		var thisimg =  target.find('img.activeslide');
	
		// calculate size and position
		var dimensions = superbgCalcSize(target, $(thisimg).width(), $(thisimg).height());
		var newwidth   = dimensions[0];
		var newheight  = dimensions[1];
		var newleft    = dimensions[2];
		var newtop     = dimensions[3];
	
		// set new width/height
		$(thisimg).css('width', newwidth + 'px');
		$(thisimg).css('height', newheight + 'px');
	
		// fix for IE6
		if (opts.superbg_isIE6 && (opts.inlineMode === 0)) {
			target.width(newwidth).height(newheight);
			$(thisimg).width(newwidth);
			$(thisimg).height(newheight);
		}
		
		// set new left position
		$(thisimg).css('left', newleft + 'px');
	
		// set new top when option vertical_center is on, otherwise set to 0
		if (opts.vertical_center === 1){
			$(thisimg).css('top', newtop + 'px');
		} else {
			$(thisimg).css('top', '0px');
		}
			
	};	
	
	// calculate image size, top and left position
	function superbgCalcSize(cont, imgw, imgh) {		
	
		// get browser dimensions
		var browserwidth  = $(window).width();
		var browserheight = $(window).height();
		
		// use container dimensions when inlinemode is on
		if (opts.inlineMode === 1) {
			browserwidth  = cont.width();
			browserheight = cont.height();
		}
		
		// calculate ratio
		var ratio = imgh / imgw;
	
		// calculate new size
		var newheight = 0; var newwidth = 0;
		if ((browserheight / browserwidth) > ratio) {
			newheight = browserheight;
			newwidth = Math.round(browserheight / ratio);
		} else {
			newheight = Math.round(browserwidth * ratio);
			newwidth = browserwidth;
		}
		
		// calculate new left and top position
		var newleft = Math.round((browserwidth - newwidth) / 2);
		var newtop = Math.round((browserheight - newheight) / 2);
		
		var rcarr = [newwidth, newheight, newleft, newtop];
		return rcarr;
		
	};
	
	
	// show image, call callback onHide
	function superbgShowImage(img, link) {	
	
		// get image-index from rel-attribute of the link
		if (link) {
			opts.superbg_imgActual = $(link).attr('rel');
		}
		if (typeof img !== 'undefined') {
			opts.superbg_imgActual = img;
		}
	
		// exit when already active image 
		if (target.find('img.activeslide').attr('rel') === opts.superbg_imgActual) {
			return false;
		}
	
		// exit when animation is running, otherwise set switch
		if (opts.superbg_inAnimation) { 
			return false; 
		} else { 
			opts.superbg_inAnimation = true; 
		}
	
		// get source and title from link
		var imgsrc = ''; var imgtitle = '';
		if (target.children('img' + "[rel='" + opts.superbg_imgActual + "']").length === 0) {
			imgsrc   = ctrls.find("a[rel='" + opts.superbg_imgActual + "']").attr('href');
			imgtitle = ctrls.find("a[rel='" + opts.superbg_imgActual + "']").attr('title');
		// otherwise get source from image	
		} else {
			imgsrc = target.children('img' + "[rel='" + opts.superbg_imgActual + "']").attr('src');
		}
	
		// callback function onHide
		if ((typeof opts.onHide === 'function') && (opts.onHide !== null) && (opts.superbg_imgLast >= 0)) {
			opts.onHide(opts.superbg_imgLast);
		}
	
		// load the image, do selected transition
		superbgLoadImage(imgsrc, imgtitle);
		
		// set class activeslide for the actual link
		if(ctrls){
			ctrls.find('a').removeClass('activeslide');
			ctrls.children("a[rel='" + opts.superbg_imgActual + "']").addClass('activeslide');
		}
		// save image-index
		opts.superbg_imgSlide = opts.superbg_imgActual;
		opts.superbg_imgLast  = opts.superbg_imgActual;
		
		return false;
	
	};		

	// load image, show the image and perform the transition
	function superbgLoadImage(imgsrc, imgtitle) {
	
		// load image, add image to container
		if (target.children("img[rel='" + opts.superbg_imgActual + "']").length === 0) {
			var img = new Image();
			$(img).load(function() {
				$(this).css('position', 'absolute').hide();
				if (target.children("img[rel='" + opts.superbg_imgActual + "']").length === 0) {
					$(this).attr('rel', opts.superbg_imgActual);
					if (opts.showtitle === 1) {
						$(this).attr('title', imgtitle);
					}	
					target.prepend(this);
				}	
				
				var thisimg = target.children("img[rel='" + opts.superbg_imgActual + "']");
				var dimensions = superbgCalcSize(target, img.width, img.height);
				superbgTransition(thisimg, dimensions);
				
				// first image loaded?	
				if (!opts.superbg_firstLoaded) {
					// preload files when images are linked
					if ((opts.preload === 1) && ctrls.children('a').length > 0) {
						opts.superbg_preload = setInterval("superbgimagePreload()", 250);
					}
					opts.superbg_firstLoaded = true;
				}
				img.onload=function(){};
			}).error(function() {
				opts.superbg_inAnimation = false;
				img.onerror=function(){};
			}).attr('src', imgsrc);
			
		// image already loaded	
		} else {
			var thisimg = target.children("img[rel='" + opts.superbg_imgActual + "']");
			var dimensions = superbgCalcSize(target, $(thisimg).width(), $(thisimg).height());
			// perform the transition
			superbgTransition(thisimg, dimensions);
			if (!opts.superbg_firstLoaded) {
				// preload files when images are linked
				if ((opts.preload === 1) && ctrls && ctrls.children('a').length > 0) {
					opts.superbg_preload = setInterval("superbgimagePreload()", 250);
				}
				opts.superbg_firstLoaded = true;
			}	
		}	
	
	};
	
	// perform the transition
	function superbgTransition(thisimg, dimensions) {

		var newwidth  = dimensions[0];
		var newheight = dimensions[1];
		var newleft   = dimensions[2];
		var newtop    = dimensions[3];

		// set new width, height and left position		
		$(thisimg).css('width', newwidth + 'px').css('height', newheight + 'px').css('left', newleft + 'px');

		// callbacks onClick, onMouseenter, onMouseleave, onMousemove
		if ((typeof opts.onClick === 'function') && (opts.onClick !== null)) {
			$(thisimg).unbind('click').click(function() { opts.onClick(opts.superbg_imgActual); });
		}
		if ((typeof opts.onMouseenter === 'function') && (opts.onMouseenter !== null)) {
			$(thisimg).unbind('mouseenter').mouseenter(function() { opts.onMouseenter(opts.superbg_imgActual); });
		}
		if ((typeof opts.onMouseleave === 'function') && (opts.onMouseleave !== null)) {
			$(thisimg).unbind('mouseleave').mouseleave(function() { opts.onMouseleave(opts.superbg_imgActual); });
		}
		if ((typeof opts.onMousemove === 'function') && (opts.onMousemove !== null)) {
			$(thisimg).unbind('mousemove').mousemove(function(e) { opts.onMousemove(opts.superbg_imgActual, e); });
		}
		
		// random transition
		if (opts.randomtransition === 1) {
			var randomtrans = (0 + parseInt(Math.random() * (opts.superbg_max_randomtrans - 0 + 1), 10));
			while (randomtrans === opts.superbg_lasttrans) {
				randomtrans = (0 + parseInt(Math.random() * (opts.superbg_max_randomtrans - 0 + 1), 10));
			}
			opts.transition = randomtrans;
		}		
		
		// set new top when option vertical_center is on, otherwise set to 0
		if (opts.vertical_center === 1){
			$(thisimg).css('top', newtop + 'px');
		} else {
			$(thisimg).css('top', '0px');
		}

		// switch for transitionout
		var akt_transitionout = opts.transitionout;
		// no transitionout for blind effect
		if ((opts.transition === 6) || (opts.transition === 7)) {
			akt_transitionout = 0;
		}	
		
		// prepare last active slide for transition out/hide
		if (akt_transitionout === 1) {
			target.find('img.activeslide').removeClass('activeslide').addClass('lastslide').css('z-index', 0);
		} else {
			target.find('img.activeslide').removeClass('activeslide').addClass('lastslideno').css('z-index', 0);
		}
		
		// set z-index on new active image
		$(thisimg).css('z-index', 1);

		// be sure transition is numeric
		opts.transition = parseInt(opts.transition, 10);
		$.superbg_lasttrans = opts.transition;
		
		// no transition
		var theEffect = ''; var theDir = '';
		if (opts.transition === 0) {
			$(thisimg).show(1, function() { 
				if ((typeof opts.onShow === 'function') && (opts.onShow !== null)) opts.onShow(opts.superbg_imgActual);
				opts.superbg_inAnimation = false;
			}).addClass('activeslide');
		// transition fadeIn
		} else if (opts.transition === 1) {
			$(thisimg).fadeIn(opts.speed, function() {
				if ((typeof opts.onShow === 'function') && (opts.onShow !== null)) opts.onShow(opts.superbg_imgActual);
				target.find('img.lastslideno').hide(1, null).removeClass('lastslideno');
				opts.superbg_inAnimation = false;
			}).addClass('activeslide');
		// other transitions slide and blind
		} else {
			if (opts.transition === 2) { theEffect = 'slide'; theDir = 'up'; }
			if (opts.transition === 3) { theEffect = 'slide'; theDir = 'right'; }
			if (opts.transition === 4) { theEffect = 'slide'; theDir = 'down'; }
			if (opts.transition === 5) { theEffect = 'slide'; theDir = 'left'; }
			if (opts.transition === 6) { theEffect = 'blind'; theDir = 'horizontal'; }
			if (opts.transition === 7) { theEffect = 'blind'; theDir = 'vertical'; }
			if (opts.transition === 90) {
				theEffect = 'slide'; theDir = 'left';			
				if (opts.superbg_direction === 1) {
					theDir = 'right';
				}
			}
			if (opts.transition === 91) { 
				theEffect = 'slide'; theDir = 'down';
				if (opts.superbg_direction === 1) {
					theDir = 'up';
				}
			}			
			// perform transition slide/blind, add class activeslide
			$(thisimg).show(theEffect, { direction: theDir }, opts.speed, function() {
				if ((typeof opts.onShow === 'function') && (opts.onShow !== null)) opts.onShow(opts.superbg_imgActual);
				target.find('img.lastslideno').hide(1, null).removeClass('lastslideno');
				opts.superbg_inAnimation = false;
			}).addClass('activeslide');
		}
		
		// perform transition out
		if (akt_transitionout === 1) {
			// add some time to out speed
			var outspeed = opts.speed;
			if (opts.speed == 'slow') {
				outspeed = 600 + 200;
			} else if (opts.speed == 'normal') {
				outspeed = 400 + 200;
			} else if (opts.speed == 'fast') {
				outspeed = 400 + 200;
			} else {
				outspeed = opts.speed + 200;
			}

			// no transition	
			if (opts.transition === 0) {
				target.find('img.lastslide').hide(1, null).removeClass('lastslide');
			// transition fadeIn
			} else if (opts.transition == 1) {
				target.find('img.lastslide').fadeOut(outspeed).removeClass('lastslide');
			// other transitions slide and blind	
			} else {
				if (opts.transition === 2) { theEffect = 'slide'; theDir = 'down'; }
				if (opts.transition === 3) { theEffect = 'slide'; theDir = 'left'; }
				if (opts.transition === 4) { theEffect = 'slide'; theDir = 'up'; }
				if (opts.transition === 5) { theEffect = 'slide'; theDir = 'right'; }
				if (opts.transition === 6) { theEffect = ''; theDir = ''; }
				if (opts.transition === 7) { theEffect = ''; theDir = ''; }
				if (opts.transition === 90) { 
					theEffect = 'slide'; theDir = 'right';
					if (opts.superbg_direction === 1) {
						theDir = 'left';
					}
				}
				if (opts.transition === 91) { 
					theEffect = 'slide'; theDir = 'up';
					if (opts.superbg_direction === 1) {
						theDir = 'down';
					}
				}
				// perform transition slide/blind, add class activeslide
				target.find('img.lastslide').hide(theEffect, { direction: theDir }, outspeed).removeClass('lastslide');
			}
		// no transition out
		} else {
			target.find('img.lastslide').hide(1, null).removeClass('lastslide');
		}
		
	};
	
	
}


// default options
$.fn.superbgimage.defaults = {
	//id: 'superbgimage', // id for the containter
	controls_id: null, //id for link controls
	z_index: 0, // z-index for the container
	inlineMode: 0, // 0-resize to browser size, 1-do not resize to browser-size
	showimage: 1, // number of first image to display
	vertical_center: 1, // 0-align top, 1-center vertical
	transition: 1, // 0-none, 1-fade, 2-slide down, 3-slide left, 4-slide top, 5-slide right, 6-blind horizontal, 7-blind vertical, 90-slide right/left, 91-slide top/down
	transitionout: 1, // 0-no transition for previous image, 1-transition for previous image
	randomtransition: 0, // 0-none, 1-use random transition (0-7)
	showtitle: 0, // 0-none, 1-show title
	preload: 1, // 0-none, 1-preload images
	onShow: null, // function-callback show image
	onClick: null, // function-callback click image
	onHide: null, // function-callback hide image
	onMouseenter: null, // function-callback mouseenter
	onMouseleave: null, // function-callback mouseleave
	onMousemove: null // function-callback mousemove
};

})(jQuery);