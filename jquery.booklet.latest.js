/*
 * jQuery Booklet Plugin
 * Copyright (c) 2010 - 2012 W. Grauvogel (http://builtbywill.com/)
 *
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version : 1.3.0
 *
 * Originally based on the work of:
 *	1) Charles Mangin (http://clickheredammit.com/pageflip/)
 */;
(function ($) {

	$.fn.booklet = function (options) {

		return $(this).each(function () {
									  
			var command, config, obj, num;

			//option type string - api call
			if(typeof options == 'string') {
				//check if booklet has been initialized
				if($(this).data('booklet')) {
					command = options.toLowerCase();
					obj = $(this).data('booklet');

					if(command == 'next') {
						obj.next(); //next page
					} else if(command == 'prev') {
						obj.prev(); //previous page
					}
				}
			}
			//option type number - api call
			else if(typeof options == 'number') {
				//check if booklet has been initialized
				if($(this).data('booklet')) {
					num = options;
					obj = $(this).data('booklet');

					if(num % 2 != 0) {
						num -= 1;
					}

					if(obj.options.direction == 'RTL') {
						num = Math.abs(num - obj.options.pageTotal) - 2;
					}

					obj.goToPage(num);
				}

			}
			//else build new booklet
			else {
				config = $.extend({}, $.fn.booklet.defaults, options);

				// Instantiate the booklet
				obj = new Booklet($(this), config);
				obj.init();

				return this; //preserve chaining on main function
			}
		});
	};

	function Booklet(inTarget, inOptions) {
		var target = inTarget;
		var options = inOptions;

		var isInit = false;
		var isBusy = false;
		var isPlaying = false;
		var isHoveringRight = false;
		var isHoveringLeft = false;

		var templates = {
			empty: '<div class="b-page-empty" title=""></div>',
			//book page with no content
			blank: '<div class="b-page-blank" title=""></div>' //transparent item used with closed books
		};

		var directions = {
			leftToRight: 'LTR',
			rightToLeft: 'RTL'
		};

		var currentHash = '', hashRoot = '/page/', hash, i, j, h, a, diff,
		//page content vars
		pN, p0, p1, p2, p3, p4, pNwrap, p0wrap, p1wrap, p2wrap, p3wrap, p4wrap, wraps, sF, sB,
		//control vars
		p3drag, p0drag, temp, relativeX, ctrls, overlaysB, overlayN, overlayP, tabs, tabN, tabP, arrows, arrowN, arrowP, customN, customP, ctrlsN, ctrlsP, menu;

		var pages = new Array();

		function BookletPage(contentNode, index, options) {
			var chapter = '';
			var title = '';
			var pageNode;

			//save chapter title
			if(contentNode.attr('rel')) {
				chapter = contentNode.attr('rel');
			}
			//save page title
			if(contentNode.attr('title')) {
				title = contentNode.attr('title');
			}

			//give content the correct wrapper and page wrapper
			if(contentNode.hasClass('b-page-empty')) {
				contentNode.wrap('<div class="b-page"><div class="b-wrap"></div></div>');
			} else if(options.closed && options.covers && (index == 1 || index == options.pageTotal - 2)) {
				contentNode.wrap('<div class="b-page"><div class="b-wrap b-page-cover"></div></div>');
			} else if(index % 2 != 0) {
				contentNode.wrap('<div class="b-page"><div class="b-wrap b-wrap-right"></div></div>');
			} else {
				contentNode.wrap('<div class="b-page"><div class="b-wrap b-wrap-left"></div></div>');
			}

			pageNode = contentNode.parents('.b-page').addClass('b-page-' + index);

			//add page numbers
			if(
			options.pageNumbers && !contentNode.hasClass('b-page-empty') && (!options.closed || (options.closed && !options.covers) || (options.closed && options.covers && index != 1 && index != options.pageTotal - 2))) {
				if(options.direction == directions.leftToRight) {
					options.startingPageNumber++;
				}
				contentNode.parent().append('<div class="b-counter">' + options.startingPageNumber + '</div>');
				if(options.direction == directions.rightToLeft) {
					options.startingPageNumber--;
				}
			}

			return {
				index: index,
				contentNode: contentNode,
				pageNode: pageNode,
				chapter: chapter,
				title: title
			}
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// INITIAL FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var init = function () {
				if(!isInit) {

					$('.b-load').children().unwrap(); // remove load wrapper for compatibility with version 1.2.0
					//setup target DOM object
					target.addClass('booklet');

					//store data for api calls
					target.data('booklet', this);

					//save original number of pages
					target.data('total', target.children().length);

					options.currentIndex = 0;

					initPages();
					initOptions();

					//call setup functions
					resetPages();
					updateControls();
					updatePager();

					isInit = true;
				}
			},
			initPages = function () {

				//fix for odd number of pages
				if((target.children().length % 2) != 0) {
					//if book is closed and using covers, add page before back cover, else after last page
					if(options.closed && options.covers) {
						target.children().last().before(templates.blank);
					} else {
						target.children().last().after(templates.blank);
					}
				}

				//if closed book, add empty pages to start and end
				if(options.closed) {
					$(templates.empty).attr({'title': options.closedFrontTitle || '', 'rel': options.closedFrontChapter || ''}).prependTo(target);
					target.children().last().attr({'title': options.closedBackTitle || '', 'rel': options.closedBackChapter || ''});
					target.append(templates.empty);
				}

				// set total page count
				options.pageTotal = target.children().length;

				options.startingPageNumber = 0;

				if(options.direction == directions.rightToLeft) {
					options.startingPageNumber = options.pageTotal;
					if(options.closed) {
						options.startingPageNumber -= 2;
					}
					if(options.covers) {
						options.startingPageNumber -= 2;
					}
					$(target.children().get().reverse()).each(function () {
						$(this).appendTo(target);
					});
				}

				//load pages
				target.children().each(function (i) {
					var newPage = new BookletPage($(this), i, options);
					pages.push(newPage);
				});

				//recall other init opts if reinitializing
				if(isInit) {
					initOptions();

					//reset page structure, otherwise throws error
					resetPages();
					updateControls();
					updatePager();
				}
			},
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// BASE FUNCTIONS
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			resetPageStructure = function () {
				//reset all content
				target.find('.b-page').removeClass('b-pN b-p0 b-p1 b-p2 b-p3 b-p4').hide();

				//add page classes
				if(options.currentIndex - 2 >= 0) {
					target.find('.b-page-' + (options.currentIndex - 2)).addClass('b-pN').show();
					target.find('.b-page-' + (options.currentIndex - 1)).addClass('b-p0').show();
				}
				target.find('.b-page-' + (options.currentIndex)).addClass('b-p1').show();
				target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p2').show();
				if(options.currentIndex + 3 <= options.pageTotal) {
					target.find('.b-page-' + (options.currentIndex + 2)).addClass('b-p3').show();
					target.find('.b-page-' + (options.currentIndex + 3)).addClass('b-p4').show();
				}

				//save structure elems to vars
				pN = target.find('.b-pN');
				p0 = target.find('.b-p0');
				p1 = target.find('.b-p1');
				p2 = target.find('.b-p2');
				p3 = target.find('.b-p3');
				p4 = target.find('.b-p4');
				pNwrap = target.find('.b-pN .b-wrap');
				p0wrap = target.find('.b-p0 .b-wrap');
				p1wrap = target.find('.b-p1 .b-wrap');
				p2wrap = target.find('.b-p2 .b-wrap');
				p3wrap = target.find('.b-p3 .b-wrap');
				p4wrap = target.find('.b-p4 .b-wrap');
				wraps = target.find('.b-wrap');

				if(options.shadows) {
					target.find('.b-shadow-f, .b-shadow-b').remove();
					sF = $('<div class="b-shadow-f"></div>').css({'right': 0, 'width': options.pWidth, 'height': options.pHeight}).appendTo(p3);
					sB = $('<div class="b-shadow-b"></div>').appendTo(p0).css({'left': 0, 'width': options.pWidth, 'height': options.pHeight});
				}
			},
			resetManualControls = function () {

				//reset vars
				isHoveringRight = isHoveringLeft = p3drag = p0drag = false;

				//manual page turning, check if jQuery UI is loaded
				if(options.manual && $.ui) {

					//implement draggable forward
					p3.draggable({
						axis: "x",
						containment: [p2.offset().left - options.pWidthH, 0, p2.offset().left + options.pWidth - 50, options.pHeight],
						drag: function (event, ui) {
							p3drag = true;
							temp = ui.originalPosition.left - ui.position.left;
							p3.removeClass('b-grab').addClass('b-grabbing');
							p3.width(40 + (temp / 2));
							p3wrap.css({'left': 10 + (temp / 8)});
							p2.width(options.pWidth - p3.width() + 10);
							if(options.shadows) {
								sF.css({'right': '-' + (20 + temp / 4) + 'px'});
								if($.support.opacity) {
									sF.css({'opacity': 0.5 * (temp / options.pWidthH)});
								} else {
									sF.css({'right': 'auto', 'left': 0.1 * p3.width()});
								}
							}
						},
						stop: function (event, ui) {
							hoverAnimationEnd(false);
							temp = ui.originalPosition.left - ui.position.left;
							if(temp > options.pWidthH / 4) {
								if(options.shadows && !$.support.opacity) {
									sF.css({'left': 'auto'});
								}
								next();
								p3.removeClass('b-grab b-grabbing');
							} else {
								p3drag = false;
								p3.removeClass('b-grabbing').addClass('b-grab');
							}
						}
					});

					//implement draggable backwards
					p0.draggable({
						axis: "x",
						containment: [p1.offset().left + 10, 0, p1.offset().left + options.pWidth * .75, options.pHeight],
						drag: function (event, ui) {
							p0drag = true;
							temp = ui.position.left - ui.originalPosition.left;
							p0.removeClass('b-grab').addClass('b-grabbing');
							p0.css({left: 40 + (temp) / 1.5, width: 40 + (temp)});
							p0wrap.css({right: 10 + temp / 4});
							p1.css({left: ui.position.left + 20, width: options.pWidth - ui.position.left - 10});
							p1wrap.css({left: -1 * (temp + 30)});
							if(options.shadows) {
								if($.support.opacity) {
									sB.css({'opacity': 0.5 * (temp / options.pWidthH)});
								} else {
									sB.css({'left': -0.38 * options.pWidth});
								}
							}
						},
						stop: function (event, ui) {
							hoverAnimationEnd(true);
							temp = ui.position.left - ui.originalPosition.left;
							if(temp > options.pWidthH / 4) {
								prev();
								p0.removeClass('b-grab b-grabbing');
							} else {
								p0drag = false;
								p0.removeClass('b-grabbing').addClass('b-grab');
							}
						}
					});

					//mouse tracking for page movement
					$(target).unbind('mousemove mouseout').bind('mousemove', function (e) {
						relativeX = e.pageX - target.offset().left;
						if(relativeX < 50) {
							hoverAnimationStart(false);
						} else if(relativeX > options.pWidth - 50 && options.currentIndex == 0 && options.autoCenter && options.closed) {
							hoverAnimationStart(true);
						} else if(relativeX > 50 && relativeX < options.width - 50) {
							hoverAnimationEnd(false);
							hoverAnimationEnd(true);
						} else if(relativeX > options.width - 50) {
							hoverAnimationStart(true);
						}
					}).bind('mouseout', function () {
						hoverAnimationEnd(false);
						hoverAnimationEnd(true);
					});

				}
			},
			resetCSS = function () {
				//update css
				target.find('.b-shadow-f, .b-shadow-b, .b-p0, .b-p3').css({'filter': '', 'zoom': ''});
				
				if(options.manual && $.ui) {
					target.find('.b-page').draggable('destroy').removeClass('b-grab b-grabbing');
				}
				wraps.attr('style', '');
				wraps.css({
					'left': 0,
					'width': options.pWidth - (options.pagePadding * 2) - (options.pageBorder * 2),
					'height': options.pHeight - (options.pagePadding * 2) - (options.pageBorder * 2),
					'padding': options.pagePadding
				});
				p0wrap.css({
					'right': 0,
					'left': 'auto'
				});
				p1.css({
					'left': 0,
					'width': options.pWidth,
					'height': options.pHeight
				});
				p2.css({
					'left': options.pWidth,
					'width': options.pWidth,
					'opacity': 1,
					'height': options.pHeight
				});
				if(options.closed && options.autoCenter && options.currentIndex >= options.pageTotal - 2) {
					p2.hide();
				}
				pN.css({
					'left': 0,
					'width': options.pWidth,
					'height': options.pHeight
				});
				p0.css({
					'left': 0,
					'width': 0,
					'height': options.pHeight
				});
				p3.stop().css({
					'left': options.pWidth * 2,
					'width': 0,
					'height': options.pHeight,
					paddingLeft: 0
				});
				p4.css({
					'left': options.pWidth,
					'width': options.pWidth,
					'height': options.pHeight
				});

				if(options.closed && options.autoCenter && options.currentIndex == 0) {
					pN.css({'left': 0});
					p1.css({'left': options.pWidthN});
					p2.css({'left': 0});
					p3.css({'left': options.pWidth});
					p4.css({'left': 0});
				}

				if(options.closed && options.autoCenter && (options.currentIndex == 0 || options.currentIndex >= options.pageTotal - 2)) {
					if(options.overlays) {
						overlaysB.width('100%');
					}
					target.width(options.pWidth);
				} else {
					if(options.overlays) {
						overlaysB.width('50%');
					}
					target.width(options.width);
				}

				//ie fix
				target.find('.b-page').css({'filter': '', 'zoom': ''});
			},
			resetPages = function () {
				resetPageStructure();
				resetCSS();
				resetManualControls();
			},
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// ANIMATION FUNCTIONS
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			next = function () {
				if(!isBusy) {
					if(isPlaying && options.currentIndex + 2 >= options.pageTotal) {
						goToPage(0);
					} else {
						goToPage(options.currentIndex + 2);
					}
				}
			},
			prev = function () {
				if(!isBusy) {
					if(isPlaying && options.currentIndex - 2 < 0) {
						goToPage(options.pageTotal - 2);
					} else {
						goToPage(options.currentIndex - 2);
					}
				}
			},
			goToPage = function (newIndex) {
				//moving forward (increasing number)
				if(newIndex > options.currentIndex && newIndex < options.pageTotal && newIndex >= 0 && !isBusy) {
					isBusy = true;
					diff = newIndex - options.currentIndex;
					options.currentIndex = newIndex;
					options.before.call(this, options);
					updatePager();
					if(newIndex == options.pageTotal - 2) updateControls();
					updateHash(options.currentIndex + 1, options);
					initPageAnimation(diff, true, sF);

					//hide p2 as p3 moves across it
					if(options.closed && options.autoCenter && newIndex - diff == 0) {
						p2.stop().animate({width: 0,left: options.pWidth}, options.speed, options.easing);
						p4.stop().animate({left: options.pWidth}, options.speed, options.easing);
					} else {
						p2.stop().animate({width: 0}, options.speedH, options.easeIn);
					}

					//animate p3 from right to left (left: movement, width: reveal slide, paddingLeft: shadow underneath)
					//call updateAfter at end of animation to reset pages
					//animation if dragging forward
					if(p3drag) {
						p3.stop().animate({left: options.pWidth / 4, width: options.pWidth * .75, paddingLeft: options.shadowBtmWidth}, options.speedH, options.easeIn)
						         .animate({left: 0,                  width: options.pWidth,       paddingLeft: 0}, options.speedH);
					} else {
						p3.stop().animate({left: options.pWidthH, width: options.pWidthH, paddingLeft: options.shadowBtmWidth}, options.speedH, options.easeIn)
						         .animate({left: 0,               width: options.pWidth,  paddingLeft: 0}, options.speedH);
					}
					p3wrap.animate({left: options.shadowBtmWidth}, options.speedH, options.easeIn)
					      .animate({left: 0}, options.speedH, options.easeOut, function () {updateAfter()});

					//moving backward (decreasing number)
				} else if(newIndex < options.currentIndex && newIndex < options.pageTotal && newIndex >= 0 && !isBusy) {
					isBusy = true;
					diff = options.currentIndex - newIndex;
					options.currentIndex = newIndex;
					options.before.call(this, options);
					updatePager();
					if(newIndex == 0) updateControls();
					updateHash(options.currentIndex + 1, options);
					initPageAnimation(diff, false, sB);

					//animation if dragging backwards
					if(p0drag) {
						//hide p1 as p0 moves across it
						p1.animate({left: options.pWidth, width: 0}, options.speed, options.easing);
						p1wrap.animate({left: options.pWidthN}, options.speed, options.easing);

						//animate p0 from left to right (right: movement, width: reveal slide, paddingLeft: shadow underneath)
						if(options.closed && options.autoCenter && options.currentIndex == 0) {
							p0.animate({left: options.pWidthH, width: options.pWidthH}, options.speedH, options.easeIn)
							  .animate({left: 0,               width: options.pWidth}, options.speedH, options.easeOut);
							p2.stop().animate({left: 0}, options.speed, options.easing);
						} else {
							p0.animate({left: options.pWidth, width: options.pWidth}, options.speed, options.easing);
						}
						//animate .wrapper content with p0 to keep content right aligned throughout
						//call updateAfter at end of animation to reset pages
						p0wrap.animate({right: 0}, options.speed, options.easing, function () {updateAfter()});
					} else {
						//hide p1 as p0 moves across it
						p1.animate({left: options.pWidth,width: 0}, options.speed, options.easing);
						p1wrap.animate({left: options.pWidthN}, options.speed, options.easing);

						//animate p0 from left to right (right: movement, width: reveal slide, paddingLeft: shadow underneath)
						if(options.closed && options.autoCenter && options.currentIndex == 0) {
							p0.animate({left: options.pWidthH, width: options.pWidthH}, options.speedH, options.easeIn)
							  .animate({left: 0,               width: options.pWidth}, options.speedH, options.easeOut);
							p2.stop().animate({left: 0}, options.speed, options.easing);
						} else {
							p0.animate({left: options.pWidthH, width: options.pWidthH}, options.speedH, options.easeIn)
							  .animate({left: options.pWidth,  width: options.pWidth}, options.speedH, options.easeOut);
						}
						//animate .wrapper content with p0 to keep content right aligned throughout
						//call updateAfter at end of animation to reset pages
						p0wrap.animate({right: options.shadowBtmWidth}, options.speedH, options.easeIn)
						      .animate({right: 0}, options.speedH, options.easeOut, function () {updateAfter()});
					}
				}
			},
			hoverAnimationStart = function (inc) {
				if(inc) {
					if(!isBusy && !isHoveringRight && !isHoveringLeft && !p3drag && options.currentIndex + 2 <= options.pageTotal - 2) {
						//animate
						p2.stop().animate({'width': options.pWidth - 40}, 500, options.easing);
						p3.addClass('b-grab');
						if(options.closed && options.autoCenter && options.currentIndex == 0) {
							p3.stop().animate({'left': options.pWidth - 50,'width': 40}, 500, options.easing);
						} else {
							p3.stop().animate({'left': options.width - 50, 'width': 40}, 500, options.easing);
						}
						p3wrap.stop().animate({'left': 10}, 500, options.easing);
						if(options.shadows && !$.support.opacity) {
							sF.css({'right': 'auto','left': '-40%'});
						}
						isHoveringRight = true;
					}
				} else {
					if(!isBusy && !isHoveringLeft && !isHoveringRight && !p0drag && options.currentIndex - 2 >= 0) {
						//animate
						p1.stop().animate({left: 10,width: options.pWidth - 10}, 400, options.easing);
						p0.addClass('b-grab');
						p1wrap.stop().animate({left: "-10px"}, 400, options.easing);
						p0.stop().animate({left: 10,width: 40}, 400, options.easing);
						p0wrap.stop().animate({right: 10}, 400, options.easing);
						if(options.shadows && !$.support.opacity) {
							sB.css({'left': -0.38 * options.pWidth});
						}
						isHoveringLeft = true;
					}
				}
			},
			hoverAnimationEnd = function (inc) {
				if(inc) {
					if(!isBusy && isHoveringRight && !p3drag && options.currentIndex + 2 <= options.pageTotal - 2) {
						p2.stop().animate({'width': options.pWidth}, 500, options.easing);
						if(options.closed && options.autoCenter && options.currentIndex == 0) {
							p3.stop().animate({'left': options.pWidth, 'width': 0}, 500, options.easing);
						} else {
							p3.stop().animate({'left': options.width, 'width': 0}, 500, options.easing);
						}
						p3wrap.stop().animate({'left': 0}, 500, options.easing);
						if(options.shadows && !$.support.opacity) {
							sF.css({'left': 'auto'});
						}
						isHoveringRight = false;
					}
				} else {
					if(!isBusy && isHoveringLeft && !p0drag && options.currentIndex - 2 >= 0) {
						p1.stop().animate({left: 0, width: options.pWidth}, 400, options.easing);
						p1wrap.stop().animate({left: 0}, 400, options.easing);
						p0.stop().animate({left: 0, width: 0}, 400, options.easing);
						p0wrap.stop().animate({right: 0}, 400, options.easing);
						isHoveringLeft = false;
					}
				}
			},
			initPageAnimation = function (diff, inc, shadow) {
				//setup content
				if(inc && diff > 2) {

					target.find('.b-p3, .b-p4').removeClass('b-p3 b-p4').hide();
					target.find('.b-page-' + options.currentIndex).addClass('b-p3').show().stop().css({
						'left': options.pWidth * 2,
						'width': 0,
						'height': options.pHeight,
						paddingLeft: 0
					});
					target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p4').show().css({
						'left': options.pWidth,
						'width': options.pWidth,
						'height': options.pHeight
					});
					target.find('.b-page-' + options.currentIndex + ' .b-wrap').show().css({
						'width': options.pWidth - (options.pagePadding * 2),
						'height': options.pHeight - (options.pagePadding * 2),
						'padding': options.pagePadding
					});
					target.find('.b-page-' + (options.currentIndex + 1) + ' .b-wrap').show().css({
						'width': options.pWidth - (options.pagePadding * 2),
						'height': options.pHeight - (options.pagePadding * 2),
						'padding': options.pagePadding
					});

					p3 = target.find('.b-p3');
					p4 = target.find('.b-p4');
					p3wrap = target.find('.b-p3 .b-wrap');
					p4wrap = target.find('.b-p4 .b-wrap');

					if(options.closed && options.autoCenter && options.currentIndex - diff == 0) {
						p3.css({'left': options.pWidth});
						p4.css({'left': 0});
					}

					if(isHoveringRight) {
						p3.css({'left': options.width - 40, 'width': 20, 'padding-left': 10});
					}

					if(options.shadows) {
						target.find('.b-shadow-f').remove();
						sF = $('<div class="b-shadow-f"></div>').css({'right': 0, 'width': options.pWidth, 'height': options.pHeight}).appendTo(p3);
						shadow = sF;
					}

				} else if(!inc && diff > 2) {

					target.find('.b-pN, .b-p0').removeClass('b-pN b-p0').hide();
					target.find('.b-page-' + options.currentIndex).addClass('b-pN').show().css({
						'left': 0,
						'width': options.pWidth,
						'height': options.pHeight
					});
					target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p0').show().css({
						'left': 0,
						'width': 0,
						'height': options.pHeight
					});
					target.find('.b-page-' + options.currentIndex + ' .b-wrap').show().css({
						'width': options.pWidth - (options.pagePadding * 2),
						'height': options.pHeight - (options.pagePadding * 2),
						'padding': options.pagePadding
					});
					target.find('.b-page-' + (options.currentIndex + 1) + ' .b-wrap').show().css({
						'width': options.pWidth - (options.pagePadding * 2),
						'height': options.pHeight - (options.pagePadding * 2),
						'padding': options.pagePadding
					});

					pN = target.find('.b-pN');
					p0 = target.find('.b-p0');
					pNwrap = target.find('.b-pN .b-wrap');
					p0wrap = target.find('.b-p0 .b-wrap');

					if(options.closed && options.autoCenter) {
						pN.css({'left': 0});
					}
					p0wrap.css({'right': 0, 'left': 'auto'});

					if(isHoveringLeft) {
						p0.css({
							left: 10,
							width: 40
						});
						p0wrap.css({
							right: 10
						});
					}

					//p0.detach().appendTo(target);
					if(options.shadows) {
						target.find('.b-shadow-b, .b-shadow-f').remove();
						sB = $('<div class="b-shadow-b"></div>').appendTo(p0).css({'left': 0, 'width': options.pWidth, 'height': options.pHeight});
						shadow = sB;
					}
				}

				//update page visibility
				//if moving to start and end of book
				if(options.closed) {
					if(!inc && options.currentIndex == 0) {
						pN.hide();
					} else if(!inc) {
						pN.show();
					}
					if(inc && options.currentIndex >= options.pageTotal - 2) {
						p4.hide();
					} else if(inc) {
						p4.show();
					}
				}

				//init shadows
				if(options.shadows) {
					//check for opacity support -> animate shadow overlay on moving slide
					if($.support.opacity) {
						shadow.animate({
							opacity: 1
						}, options.speedH, options.easeIn).animate({
							opacity: 0
						}, options.speedH, options.easeOut);
					} else {
						if(inc) {
							shadow.animate({
								right: options.shadowTopFwdWidth
							}, options.speed, options.easeIn);
						} else {
							shadow.animate({
								left: options.shadowTopBackWidth
							}, options.speed, options.easeIn);
						}
					}
				}

				//init position animation
				if(options.closed && options.autoCenter) {
					if(options.currentIndex == 0) {
						p3.hide();
						p4.hide();
						target.animate({width: options.pWidth}, options.speed, options.easing);
					} else if(options.currentIndex >= options.pageTotal - 2) {
						p0.hide();
						pN.hide();
						target.animate({width: options.pWidth}, options.speed, options.easing);
					} else {
						target.animate({width: options.width}, options.speed, options.easing);
					}
				}

			},
			updateAfter = function () {
				resetPages();
				updatePager();
				options.after.call(this, options);
				updateControls();
				isBusy = false;

				//update auto play timer
				if(options.auto && options.delay) {
					clearTimeout(a);
					a = setTimeout(function () {
						if(options.direction == directions.leftToRight) {
							next();
						} else {
							prev();
						}
					}, options.delay);
				}
			},
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// OPTION / CONTROL FUNCTIONS
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			initOptions = function () {

				// set total page count
				options.pageTotal = target.children().length;

				// first time initialization
				if(!isInit) {
					//set width + height
					if(!options.width) {
						options.width = target.width();
					} else if(typeof options.width == 'string' && options.width.indexOf("%") != -1) {
						options.wPercent = true;
						options.wOrig = options.width;
						options.width = (options.width.replace('%', '') / 100) * parseFloat(target.parent().css('width'));
					}
					if(!options.height) {
						options.height = target.height();
					} else if(typeof options.height == 'string' && options.height.indexOf("%") != -1) {
						options.hPercent = true;
						options.hOrig = options.height;
						options.height = (options.height.replace('%', '') / 100) * parseFloat(target.parent().css('height'));
					}
					target.width(options.width);
					target.height(options.height);

					//save page sizes and other vars
					options.pWidth = options.width / 2;
					options.pWidthN = '-' + (options.pWidth) + 'px';
					options.pWidthH = options.pWidth / 2;
					options.pHeight = options.height;
					options.speedH = options.speed / 2;

					options.currentIndex = 0;

					//set startingPage
					if(options.direction == directions.leftToRight) {
						options.currentIndex = 0;
					} else if(options.direction == directions.rightToLeft) {
						options.currentIndex = options.pageTotal - 2;
					}

					if(!isNaN(options.startingPage) && options.startingPage <= options.pageTotal && options.startingPage > 0) {
						if((options.startingPage % 2) != 0) {
							options.startingPage--
						}
						options.currentIndex = options.startingPage;
					}

					//set position
					if(options.closed && options.autoCenter) {
						if(options.currentIndex == 0) {
							target.width(options.pWidth);
						} else if(options.currentIndex >= options.pageTotal - 2) {
							target.width(options.pWidth);
						}
					}

					//set booklet opts.name
					if(options.name) {
						document.title = options.name;
					} else {
						options.name = document.title;
					}

					//save shadow widths for anim
					if(options.shadows) {
						options.shadowTopFwdWidth = '-' + options.shadowTopFwdWidth + 'px';
						options.shadowTopBackWidth = '-' + options.shadowTopBackWidth + 'px';
					}
				}

				//setup menu
				if(options.menu) {
					menu = $(options.menu).addClass('b-menu');

					//setup page selector
					if(options.pageSelector) {
						//add selector
						var pageSelector = $('<div class="b-selector b-selector-page"><span class="b-current">' + (options.currentIndex + 1) + ' - ' + (options.currentIndex + 2) + '</span></div>').appendTo(menu);
						var pageSelectorList = $('<ul></ul>').appendTo(pageSelector).empty().css('height', 'auto');

						//loop through all pages
						for(i = 0; i < options.pageTotal; i += 2) {
							j = i;
							//numbers for normal view
							var listItemNumbers = (j + 1) + '-' + (j + 2);
							if(options.closed) {
								//numbers for closed book
								j--;
								if(i == 0) {
									listItemNumbers = '1'
								} else if(i == options.pageTotal - 2) {
									listItemNumbers = options.pageTotal - 2
								} else {
									listItemNumbers = (j + 1) + '-' + (j + 2);
								}
								//numbers for closed book with covers
								if(options.covers) {
									j--;
									if(i == 0) {
										listItemNumbers = ''
									} else if(i == options.pageTotal - 2) {
										listItemNumbers = ''
									} else {
										listItemNumbers = (j + 1) + '-' + (j + 2);
									}
								}
							}
							if(i == 0) {
								pageSelector.find('.b-current').text(listItemNumbers);
							}

							// get the title
							var listItemTitle = pages[i].title;
							if(listItemTitle == '') {
								listItemTitle = pages[i + 1].title;
							}

							// get title for reversed direction
							if(options.direction == directions.rightToLeft) {
								listItemTitle = pages[Math.abs(i - options.pageTotal) - 1].title;
								if(listItemTitle == '') listItemTitle = pages[Math.abs(i - options.pageTotal) - 2].title;
							}

							// add the list item
							var pageListItem = $('<li><a href="#' + hashRoot + (i + 1) + '" id="selector-page-' + i + '"><span class="b-text">' + listItemTitle + '</span><span class="b-num">' + listItemNumbers + '</span></a></li>').appendTo(pageSelectorList);

							if(!options.hash) {
								pageListItem.find('a').click(function () {
									if(options.direction == directions.rightToLeft) {
										pageSelector.find('.b-current').text($(this).find('.b-num').text());
										goToPage(Math.abs(parseInt($(this).attr('id').replace('selector-page-', '')) - options.pageTotal) - 2);
									} else {
										goToPage(parseInt($(this).attr('id').replace('selector-page-', '')));
									}
									return false;
								});
							}
						}

						//set height
						var pageSelectorHeight = pageSelectorList.height();
						pageSelectorList.css({'height': 0, 'padding-bottom': 0});

						//add hover effects
						pageSelector.unbind('hover').hover(function () {
							pageSelectorList.stop().animate({height: pageSelectorHeight, paddingBottom: 10}, 500);
						}, function () {
							pageSelectorList.stop().animate({height: 0, paddingBottom: 0}, 500);
						});
					}

					//setup chapter selector
					if(options.chapterSelector) {

						var chapter = pages[options.currentIndex].chapter;
						if(chapter == "") {
							chapter = pages[options.currentIndex + 1].chapter;
						}

						var chapterSelector = $('<div class="b-selector b-selector-chapter"><span class="b-current">' + chapter + '</span></div>').appendTo(menu);
						var chapterSelectorList = $('<ul></ul>').appendTo(chapterSelector).empty().css('height', 'auto');

						for(i = 0; i < options.pageTotal; i += 1) {
							var chapterListItem;
							if(pages[i].chapter != "" && typeof pages[i].chapter != "undefined") {
								if(options.direction == directions.rightToLeft) {
									j = i;
									if(j % 2 != 0) {
										j--;
									}
									chapterSelector.find('.b-current').text(pages[i].chapter);
									chapterListItem = $('<li><a href="#' + hashRoot + (j + 1) + '" id="selector-page-' + (j) + '"><span class="b-text">' + pages[i].chapter + '</span></a></li>').prependTo(chapterSelectorList);
								} else {
									chapterListItem = $('<li><a href="#' + hashRoot + (i + 1) + '" id="selector-page-' + i + '"><span class="b-text">' + pages[i].chapter + '</span></a></li>').appendTo(chapterSelectorList);
								}
								if(!options.hash) {
									chapterListItem.find('a').click(function () {
										if(options.direction == directions.rightToLeft) {
											chapterSelector.find('.b-current').text($(this).find('.b-text').text());
											goToPage(Math.abs(parseInt($(this).attr('id').replace('selector-page-', '')) - options.pageTotal) - 2);
										} else {
											goToPage(parseInt($(this).attr('id').replace('selector-page-', '')));
										}
										return false;
									});
								}
							}
						}

						var chapterSelectorHeight = chapterSelectorList.height();
						chapterSelectorList.css({'height': 0, 'padding-bottom': 0});

						chapterSelector.unbind('hover').hover(function () {
							chapterSelectorList.stop().animate({height: chapterSelectorHeight, paddingBottom: 10}, 500);
						}, function () {
							chapterSelectorList.stop().animate({height: 0, paddingBottom: 0}, 500);
						});
					}
				}

				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				// CONTROLS
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				ctrls = $('<div class="b-controls"></div>').appendTo(target);

				// first time initialization
				if(!isInit) {
					if(options.manual && $.ui) {
						options.overlays = false;
					}
					//add prev next user defined controls
					if(options.next) {
						customN = $(options.next);
						customN.click(function (e) {
							e.preventDefault();
							next();
						});
					}
					if(options.prev) {
						customP = $(options.prev);
						customP.click(function (e) {
							e.preventDefault();
							prev();
						});
					}
				}

				//add overlays
				if(options.overlays) {
					overlayP = $('<div class="b-overlay b-overlay-prev b-prev" title="' + options.previousControlTitle + '"></div>').appendTo(ctrls);
					overlayN = $('<div class="b-overlay b-overlay-next b-next" title="' + options.nextControlTitle + '"></div>').appendTo(ctrls);
					overlaysB = target.find('.b-overlay');

					//ie fix
					if($.browser.msie) {
						overlaysB.css({'background': '#fff', 'filter': 'progid:DXImageTransform.Microsoft.Alpha(opacity=0) !important'});
					}
				}

				//add tabs
				if(options.tabs) {
					tabP = $('<div class="b-tab b-tab-prev b-prev" title="' + options.previousControlTitle + '">' + options.previousControlText + '</div>').appendTo(ctrls);
					tabN = $('<div class="b-tab b-tab-next b-next" title="' + options.nextControlTitle + '">' + options.nextControlText + '</div>').appendTo(ctrls);
					tabs = target.find('.b-tab');

					if(options.tabWidth) {
						tabs.width(options.tabWidth);
					}
					if(options.tabHeight) {
						tabs.height(options.tabHeight);
					}

					tabs.css({'top': '-' + tabN.outerHeight() + 'px'});
					target.css({'marginTop': tabN.outerHeight()});

					//update controls for RTL direction
					if(options.direction == directions.rightToLeft) {
						tabN.html(options.previousControlText).attr('title', options.previousControlTitle);
						tabP.html(options.nextControlText).attr('title', options.nextControlTitle);
					}
				} else {
					target.css({'marginTop': 0});
				}

				//add arrows
				if(options.arrows) {
					arrowP = $('<div class="b-arrow b-arrow-prev b-prev" title="' + options.previousControlTitle + '"><div>' + options.previousControlText + '</div></div>').appendTo(ctrls);
					arrowN = $('<div class="b-arrow b-arrow-next b-next" title="' + options.nextControlTitle + '"><div>' + options.nextControlText + '</div></div>').appendTo(ctrls);
					arrows = target.find('.b-arrow');

					//update ctrls for RTL direction
					if(options.direction == directions.rightToLeft) {
						arrowN.html('<div>' + options.previousControlText + '</div>').attr('title', options.previousControlTitle);
						arrowP.html('<div>' + options.nextControlText + '</div>').attr('title', options.nextControlTitle);
					}
				}

				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				//save all "b-prev" and "b-next" controls
				ctrlsN = ctrls.find('.b-next');
				ctrlsP = ctrls.find('.b-prev');

				//add click actions
				ctrlsN.bind('click', function (e) {
					e.preventDefault();
					next();
				});
				ctrlsP.bind('click', function (e) {
					e.preventDefault();
					prev();
				});

				//add page hover animations
				if(options.overlays && options.hovers) {
					//hovers to start draggable forward
					ctrlsN.unbind("mouseover mouseout").bind("mouseover", function () {
						hoverAnimationStart(true);
					}).bind("mouseout", function () {
						hoverAnimationEnd(true);
					});

					//hovers to start draggable backwards
					ctrlsP.unbind("mouseover mouseout").bind("mouseover", function () {
						hoverAnimationStart(false);
					}).bind("mouseout", function () {
						hoverAnimationEnd(false);
					});
				}

				//arrow animations	
				if(options.arrows) {
					if(options.arrowsHide) {
						if($.support.opacity) {
							ctrlsN.hover(function () {
								arrowN.find('div').stop().fadeTo('fast', 1);
							}, function () {
								arrowN.find('div').stop().fadeTo('fast', 0);
							});
							ctrlsP.hover(function () {
								arrowP.find('div').stop().fadeTo('fast', 1);
							}, function () {
								arrowP.find('div').stop().fadeTo('fast', 0);
							});
						} else {
							ctrlsN.hover(function () {
								arrowN.find('div').show();
							}, function () {
								arrowN.find('div').hide();
							});
							ctrlsP.hover(function () {
								arrowP.find('div').show();
							}, function () {
								arrowP.find('div').hide();
							});
						}
					} else {
						arrowN.find('div').show();
						arrowP.find('div').show();
					}
				}

				// first time control initialization
				if(!isInit) {
					//keyboard controls
					if(options.keyboard) {
						//keyboard controls
						$(document).keyup(function (event) {
							if(event.keyCode == 37 && options.keyboard) {
								prev();
							} else if(event.keyCode == 39 && options.keyboard) {
								next();
							}
						});
					}

					//hash controls
					if(options.hash) {
						setupHash();
						clearInterval(h);
						h = setInterval(function () {
							pollHash()
						}, 250);
					}

					//percentage resizing
					if(options.wPercent || options.hPercent) {
						$(window).resize(function () {
							resetSize();
						});
					}

					//auto flip book controls
					if(options.auto && options.delay) {
						clearTimeout(a);
						a = setTimeout(function () {
							if(options.direction == directions.leftToRight) {
								next();
							} else {
								prev();
							}
						}, options.delay);
						isPlaying = true;

						if(options.pause) {
							var pause = $(options.pause);
							pause.click(function (e) {
								e.preventDefault();
								if(isPlaying) {
									clearTimeout(a);
									isPlaying = false;
								}
							});
						}
						if(options.play) {
							var play = $(options.play);
							play.click(function (e) {
								e.preventDefault();
								if(!isPlaying) {
									clearTimeout(a);
									a = setTimeout(function () {
										if(options.direction == directions.leftToRight) {
											next();
										} else {
											prev();
										}
									}, options.delay);
									isPlaying = true;
								}
							});
						}
					}
				}
			},
			resetSize = function () {
				//recalculate size for percentage values
				if(options.wPercent) {
					options.width = (options.wOrig.replace('%', '') / 100) * parseFloat(target.parent().css('width'));
					target.width(options.width);
					options.pWidth = options.width / 2;
					options.pWidthN = '-' + (options.pWidth) + 'px';
					options.pWidthH = options.pWidth / 2;
				}
				if(options.hPercent) {
					options.height = (options.hOrig.replace('%', '') / 100) * parseFloat(target.parent().css('height'));
					target.height(options.height);
					options.pHeight = options.height;
				}
				resetCSS();
			},
			updateControls = function () {
				//update controls, cursors and visibility
				if(options.overlays || options.tabs || options.arrows) {
					if($.support.opacity) {
						if(options.currentIndex >= 2 && options.currentIndex != 0) {
							ctrlsP.fadeIn('fast').css('cursor', options.cursor);
						} else {
							ctrlsP.fadeOut('fast').css('cursor', 'default');
						}
						if(options.currentIndex < options.pageTotal - 2) {
							ctrlsN.fadeIn('fast').css('cursor', options.cursor);
						} else {
							ctrlsN.fadeOut('fast').css('cursor', 'default');
						}
					} else {
						if(options.currentIndex >= 2 && options.currentIndex != 0) {
							ctrlsP.show().css('cursor', options.cursor);
						} else {
							ctrlsP.hide().css('cursor', 'default');
						}
						if(options.currentIndex < options.pageTotal - 2) {
							ctrlsN.show().css('cursor', options.cursor);
						} else {
							ctrlsN.hide().css('cursor', 'default');
						}
					}
				}
			},
			updatePager = function () {
				if(options.pageSelector) {
					var currentPageNumbers = '';
					if(options.direction == directions.rightToLeft) {
						currentPageNumbers = (Math.abs(options.currentIndex - options.pageTotal) - 1) + ' - ' + ((Math.abs(options.currentIndex - options.pageTotal)));
						if(options.closed) {
							if(options.currentIndex == options.pageTotal - 2) {
								currentPageNumbers = '1'
							} else if(options.currentIndex == 0) {
								currentPageNumbers = options.pageTotal - 2
							} else {
								currentPageNumbers = (Math.abs(options.currentIndex - options.pageTotal) - 2) + ' - ' + ((Math.abs(options.currentIndex - options.pageTotal) - 1));
							}

							if(options.covers) {
								if(options.currentIndex == options.pageTotal - 2) {
									currentPageNumbers = ''
								} else if(options.currentIndex == 0) {
									currentPageNumbers = ''
								} else {
									currentPageNumbers = (Math.abs(options.currentIndex - options.pageTotal) - 3) + ' - ' + ((Math.abs(options.currentIndex - options.pageTotal) - 2));
								}
							}
						}
					} else {
						currentPageNumbers = (options.currentIndex + 1) + ' - ' + (options.currentIndex + 2);
						if(options.closed) {
							if(options.currentIndex == 0) {
								currentPageNumbers = '1'
							} else if(options.currentIndex == options.pageTotal - 2) {
								currentPageNumbers = options.pageTotal - 2
							} else {
								currentPageNumbers = (options.currentIndex) + '-' + (options.currentIndex + 1);
							}

							if(options.covers) {
								if(options.currentIndex == 0) {
									currentPageNumbers = ''
								} else if(options.currentIndex == options.pageTotal - 2) {
									currentPageNumbers = ''
								} else {
									currentPageNumbers = (options.currentIndex - 1) + '-' + (options.currentIndex);
								}
							}
						}
					}
					$(options.menu + ' .b-selector-page .b-current').text(currentPageNumbers);
				}
				if(options.chapterSelector) {
					if(pages[options.currentIndex].chapter != "") {
						$(options.menu + ' .b-selector-chapter .b-current').text(pages[options.currentIndex].chapter);
					} else if(pages[options.currentIndex + 1].chapter != "") {
						$(options.menu + ' .b-selector-chapter .b-current').text(pages[options.currentIndex + 1].chapter);
					}

					if(options.direction == directions.rightToLeft && pages[options.currentIndex + 1].chapter != "") {
						$(options.menu + ' .b-selector-chapter .b-current').text(pages[options.currentIndex + 1].chapter);
					} else if(pages[options.currentIndex] != "") {
						$(options.menu + ' .b-selector-chapter .b-current').text(pages[options.currentIndex].chapter);
					}
				}
			},
			// HASH FUNCTIONS	
			setupHash = function () {
				hash = getHashNum();

				if(!isNaN(hash) && hash <= options.pageTotal - 1 && hash >= 0 && hash != '') {
					if((hash % 2) != 0) {
						hash--;
					}
					options.currentIndex = hash;
				} else {
					updateHash(options.currentIndex + 1, options);
				}

				currentHash = hash;
			},
			pollHash = function () {
				hash = getHashNum();

				//check page num
				if(!isNaN(hash) && hash <= options.pageTotal - 1 && hash >= 0) {
					if(hash != options.currentIndex && hash.toString() != currentHash) {
						if((hash % 2) != 0) {

							hash--
						}

						document.title = options.name + options.hashTitleText + (hash + 1);

						if(!isBusy) {
							goToPage(hash);
							currentHash = hash;
						}
					}
				}
			},
			getHashNum = function () {
				//get page number from hash tag, last element
				var hash = window.location.hash.split('/');
				if(hash.length > 1) {
					var hashNum = parseInt(hash[2]) - 1;
					if(options.direction == directions.rightToLeft) {
						hashNum = Math.abs(hashNum + 1 - options.pageTotal);
					}
					return hashNum;
				} else {
					return '';
				}
			},
			updateHash = function (hash, options) {
				//set the hash
				if(options.hash) {
					if(options.direction == directions.rightToLeft) {
						hash = Math.abs(hash - options.pageTotal);
					}
					window.location.hash = hashRoot + hash;
				}
			},
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// DYNAMIC FUNCTIONS	
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			addPage = function (index, html) {
				//validate inputs
				if(index == "start") {
					index = 0;
				} else if(index == "end") {
					index = target.data('total');
				} else if(typeof index == "number") {
					if(index < 0 || index > target.data('total')) {
						return;
					}
				} else if(typeof index == "undefined") {
					return;
				}

				if(typeof html == "undefined" || html == '') {
					return;
				}

				//remove booklet markup
				target.find(".b-wrap").unwrap();
				target.find(".b-wrap").children().unwrap();
				target.find(".b-counter, .b-page-blank, .b-page-empty, .b-shadow-f, .b-shadow-b").remove();

				//remove generated controls
				ctrls.remove();
				ctrls = null;

				if(options.menu) {
					options.menu.removeClass('b-menu').children().remove();
				}

				//adjust page order
				if(options.direction == directions.rightToLeft) {
					$(target.children().get().reverse()).each(function () {
						$(this).appendTo(target);
					});
				}

				//add new page
				if(options.closed && options.covers && index == target.data('total')) {
					//end of closed-covers book
					target.children(':eq(' + (index - 1) + ')').before(html);
				} else if(options.closed && options.covers && index == 0) {
					//start of closed-covers book
					target.children(':eq(' + index + ')').after(html);
				} else if(index == target.data('total')) {
					//end of book
					target.children(':eq(' + (index - 1) + ')').after(html);
				} else {
					target.children(':eq(' + index + ')').before(html);
				}

				target.data('total', target.children().length);

				//recall initialize functions
				initPages();
			};

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// PUBLIC FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		return {
			init: init,
			next: next,
			prev: prev,
			goToPage: function (newIndex) {
				if(newIndex % 2 != 0) {
					newIndex -= 1;
				}
				if(options.direction == directions.rightToLeft) {
					newIndex = Math.abs(newIndex - options.pageTotal) - 2;
				}
				goToPage(newIndex)
			},
			addPage: addPage,
			options: options
		};
	}

	//define default options
	$.fn.booklet.defaults = {
		name:                 null,                            // name of the booklet to display in the document title bar
		width:                600,                             // container width
		height:               400,                             // container height
		speed:                1000,                            // speed of the transition between pages
		direction:            'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
		startingPage:         0,                               // index of the first page to be displayed
		easing:               'easeInOutQuad',                 // easing method for complete transition
		easeIn:               'easeInQuad',                    // easing method for first half of transition
		easeOut:              'easeOutQuad',                   // easing method for second half of transition
		
		closed:               false,                           // start with the book "closed", will add empty pages to beginning and end of book
		closedFrontTitle:     'Beginning',                     // used with "closed", "menu" and "pageSelector", determines title of blank starting page
		closedFrontChapter:   'Beginning of Book',             // used with "closed", "menu" and "chapterSelector", determines chapter name of blank starting page
		closedBackTitle:      'End',                           // used with "closed", "menu" and "pageSelector", determines chapter name of blank ending page
		closedBackChapter:    'End of Book',                   // used with "closed", "menu" and "chapterSelector", determines chapter name of blank ending page
		covers:               false,                           // used with "closed", makes first and last pages into covers, without page numbers (if enabled)
		autoCenter:           false,                           // used with "closed", makes book position in center of container when closed
		
		pagePadding:          10,                              // padding for each page wrapper
		pageNumbers:          true,                            // display page numbers on each page
		pageBorder:           0,                               // size of the border around each page
		
		manual:               true,                            // enables manual page turning, requires jQuery UI to function
		
		hovers:               true,                            // enables preview page-turn hover animation, shows a small preview of previous or next page on hover
		overlays:             true,                            // enables navigation using a page sized overlay, when enabled links inside the content will not be clickable
		tabs:                 false,                           // adds tabs along the top of the pages
		tabWidth:             60,                              // set the width of the tabs
		tabHeight:            20,                              // set the height of the tabs
		nextControlText:      'Next',                          // inline text for all 'next' controls
		previousControlText:  'Previous',                      // inline text for all 'previous' controls
		nextControlTitle:     'Next Page',                     // text for title attributes of all 'next' controls
		previousControlTitle: 'Previous Page',                 // text for title attributes of all 'previous' controls
		arrows:               false,                           // adds arrow overlays over the book edges
		arrowsHide:           false,                           // auto hides arrows when controls are not hovered
		cursor:               'pointer',                       // cursor css setting for side bar areas
		
		hash:                 false,                           // enables navigation using a hash string, ex: #/page/1 for page 1, will affect all booklets with 'hash' enabled
		hashTitleText:        " - Page ",                      // text which forms the hash page title, ex: (Name)" - Page "(1)
		keyboard:             true,                            // enables navigation with arrow keys (left: previous, right: next)
		next:                 null,                            // selector for element to use as click trigger for next page
		prev:                 null,                            // selector for element to use as click trigger for previous page
		auto:                 false,                           // enables automatic navigation, requires "delay"
		delay:                5000,                            // amount of time between automatic page flipping
		pause:                null,                            // selector for element to use as click trigger for pausing auto page flipping
		play:                 null,                            // selector for element to use as click trigger for restarting auto page flipping
		
		menu:                 null,                            // selector for element to use as the menu area, required for 'pageSelector'
		pageSelector:         false,                           // enables navigation with a drop-down menu of pages, requires 'menu'
		chapterSelector:      false,                           // enables navigation with a drop-down menu of chapters, determined by the "rel" attribute, requires 'menu'
		
		shadows:              true,                            // display shadows on page animations
		shadowTopFwdWidth:    166,                             // shadow width for top forward animation
		shadowTopBackWidth:   166,                             // shadow width for top back animation
		shadowBtmWidth:       50,                              // shadow width for bottom shadow
		
		before:               function(){},                    // callback invoked before each page turn animation
		after:                function(){}                     // callback invoked after each page turn animation
	}
	
})(jQuery);