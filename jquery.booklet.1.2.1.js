/*
 * jQuery Booklet Plugin
 * Copyright (c) 2010 W. Grauvogel (http://builtbywill.com/)
 *
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version : 1.2.1
 *
 * Originally based on the work of:
 *	1) Charles Mangin (http://clickheredammit.com/pageflip/)
 */
;(function($) {
		   
	$.fn.booklet = function(options){
	
		var command, config, obj, id, i, num;
	
		//option type string - api call
		if(typeof options == 'string')
		{
			//check if booklet has been initialized
			 if($(this).data('booklet')){
				command = options.toLowerCase();
				obj = $(this).data('booklet');
			
				if(command == 'api'){ return obj } //returns entire api reference for booklet, giving access to functions
				else if(command == 'next'){ obj.next() } //next page
				else if(command == 'prev'){ obj.prev() } //previous page
			
			 }
		}
		//option type number - api call		
		else if(typeof options == 'number')
		{
			//check if booklet has been initialized
			 if($(this).data('booklet')){
				num = options;
				obj = $(this).data('booklet');
			
				if(num % 2 != 0) {
					num-= 1;
				}
			
				obj.gotoPage(num);
			 }
		 
		}
		//else build new booklet
		else
		{
			config = $.extend({}, $.fn.booklet.defaults, options);

			// Instantiate the booklet
			obj = new booklet($(this), config);
			obj.init();
		
			return this; //preserve chainability on main function
		}	
	}
	
	function page(target, index, options)
	{
		this.index = index;
		this.content = target;
		this.chapter = '';
		this.title = '';
		this.isCurrent = false;
		
		//save chapter title
		if(target.attr('rel')){
			this.chapter = target.attr('rel');
		}
		//save page title
		if(target.attr('title')){
			this.title = target.attr('title');
		}
			
		//give content the correct wrapper and page wrapper
		if(target.hasClass('b-page-empty')){
			target.wrap('<div class="b-page"><div class="b-wrap"></div></div>');
		}else if(options.closed && options.covers && (index == 1 || index == options.pageTotal-2)){
			target.wrap('<div class="b-page"><div class="b-wrap b-page-cover"></div></div>');
		}else if(index % 2 != 0){
			target.wrap('<div class="b-page"><div class="b-wrap b-wrap-right"></div></div>');
		}else{
			target.wrap('<div class="b-page"><div class="b-wrap b-wrap-left"></div></div>');
		}
		
		this.node = target.parents('.b-page').addClass('b-page-'+index);
	
		//add page numbers
		options.startingPageNumber = 1;
		if(options.pageNumbers && !target.hasClass('b-page-empty') && (!options.closed || (options.closed && !options.covers) || (options.closed && options.covers && index != 1 && index != options.pageTotal-2))){
			$(this).parent().append('<div class="b-counter">'+(options.startingPageNumber)+'</div>');
			options.startingPageNumber++;
		}
	}

	function booklet(target, options)
	{
		var target = target;
		var options = options;
		
		var isInit = false;
		var isBusy = false;
		var isPlaying = false;
		var isHoveringRight = false;
		var isHoveringLeft = false;
		
		var titles = new Array();
		var chapters = new Array();
		var templates = {
			empty : '<div class="b-page-empty" title="" rel=""></div>', //book page with no content
			blank : '<div class="b-page-blank" title="" rel=""></div>'  //transparent item used with closed books
		};

		var currhash = '', hash, i, j, p, h, a, diff, 
		//page content vars
		pN, p0, p1, p2, p3, p4, pNwrap, p0wrap, p1wrap, p2wrap, p3wrap, p4wrap, wraps, sF, sB,
		//control vars
		p3drag, p0drag, temp, relativeX,
		ctrls, overlaysB, overlayN, overlayP, tabs, tabN, tabP, arrows, arrowN, arrowP, next, prev, ctrlsN, ctrlsP,
		menu, chapter, dd, ddUL, ddH, ddLI, ddA, ddT, ddC, ddCUL, ddCH, ddCLI, ddCA, ddCT;
		
		var pages = new Array();
		
		// Page Functions
		
			
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// INITIAL FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var init = function(){
			if(!isInit){
				
				//setup target DOM object
				target.addClass('booklet');
				
				//store data for api calls 
				target.data('booklet', this);
				
				//save original number of pages
				options.pageTotal = target.children().length;
				options.curr = 0;
				
				initPages();
				initOptions();
				
				//call setup functions				
				resetPages();
				//updateCtrls();
				//updatePager();
				
				isInit = true;
			}
		}
		
		var initPages = function(){
			
			//fix for odd number of pages
			if((target.children().length % 2) != 0){
				//if book is closed and using covers, add page before back cover, else after last page
				if(options.closed && options.covers){
					target.children().last().before(templates.blank);
				}else{
					target.children().last().after(templates.blank);
				}
			}
		
			//if closed book, add empty pages to start and end
			if(options.closed){
				$(templates.empty).attr({'title':options.closedFrontTitle || "Beginning", 'rel':options.closedFrontChapter || "Beginning of Book"}).prependTo(target);
				target.children().last().attr({'title':options.closedBackTitle || "End", 'rel':options.closedBackChapter || "End of Book"});		
				target.append(templates.empty);		
			}
			
			//load pages
			target.children().each(function(i){
				var newPage = new page($(this), i, options);
				pages.push(newPage);
			});				
						
			//recall other init options if reinitializing
			if(isInit){
				initOptions();
			
				//reset page structure, otherwise throws error
				resetPages();
				//updateCtrls();
				//updatePager();
			}
		}
		
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// BASE FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		resetPageStruct = function(){
			//reset all content
			target.find('.b-page').removeClass('b-pN b-p0 b-p1 b-p2 b-p3 b-p4').hide();
		
			//add page classes
			if(options.curr-2 >= 0){
				target.find('.b-page-'+(options.curr-2)).addClass('b-pN').show();
				target.find('.b-page-'+(options.curr-1)).addClass('b-p0').show();
			}
			target.find('.b-page-'+(options.curr)).addClass('b-p1').show();
			target.find('.b-page-'+(options.curr+1)).addClass('b-p2').show();
			if(options.curr+3 <= options.pTotal){
				target.find('.b-page-'+(options.curr+2)).addClass('b-p3').show();
				target.find('.b-page-'+(options.curr+3)).addClass('b-p4').show();
			}
		
			//save structure elems to vars
			pN     = target.find('.b-pN');
			p0     = target.find('.b-p0');
			p1     = target.find('.b-p1');
			p2     = target.find('.b-p2');
			p3     = target.find('.b-p3');
			p4     = target.find('.b-p4');
			pNwrap = target.find('.b-pN .b-wrap');
			p0wrap = target.find('.b-p0 .b-wrap');
			p1wrap = target.find('.b-p1 .b-wrap');
			p2wrap = target.find('.b-p2 .b-wrap');
			p3wrap = target.find('.b-p3 .b-wrap');
			p4wrap = target.find('.b-p4 .b-wrap');
			wraps  = target.find('.b-wrap');
			
			if(options.shadows){
				target.find('.b-shadow-f, .b-shadow-b').remove();		
				sF = $('<div class="b-shadow-f"></div>').css({'right':0,'width':options.pWidth, 'height':options.pHeight}).appendTo(p3);
				sB = $('<div class="b-shadow-b"></div>').appendTo(p0).css({'left':0,'width':options.pWidth, 'height':options.pHeight});		
			}
		},
		resetCSS = function(){
			//update css
			target.find('.b-shadow-f, .b-shadow-b, .b-p0, .b-p3').css({'filter':'','zoom':''});
			if(options.manual && $.ui){
				target.find('.b-page').draggable('destroy').removeClass('b-grab b-grabbing');		
			}
			wraps.attr('style','');
			wraps.css({'left':0,'width':options.pWidth-(options.pagePadding*2) - (options.pageBorder*2), 'height':options.pHeight-(options.pagePadding*2) - (options.pageBorder*2), 'padding': options.pagePadding});
			p0wrap.css({'right':0,'left':'auto'});
			p1.css({'left':0,'width':options.pWidth, 'height':options.pHeight});			
			p2.css({'left':options.pWidth, 'width':options.pWidth, 'opacity':1, 'height':options.pHeight});
			if(options.closed && options.autoCenter && options.curr >= options.pTotal-2){
				p2.hide();
			}
			pN.css({'left':0, 'width':options.pWidth, 'height':options.pHeight});
			p0.css({'left':0, 'width':0, 'height':options.pHeight});
			p3.stop().css({'left':options.pWidth*2, 'width':0, 'height':options.pHeight, paddingLeft:0});
			p4.css({'left':options.pWidth, 'width':options.pWidth, 'height':options.pHeight});
		
			if(options.closed && options.autoCenter && options.curr == 0){
				pN.css({'left':0});
				p1.css({'left':options.pWidthN});
				p2.css({'left':0});
				p3.css({'left':options.pWidth});
				p4.css({'left':0});
			}
		
			if(options.closed && options.autoCenter && (options.curr == 0 || options.curr >= options.pTotal-2)){
				if(options.overlays){overlaysB.width('100%');}
				target.width(options.pWidth);
			}else{
				if(options.overlays){overlaysB.width('50%');}
				target.width(options.width);
			}
		
			target.find('.b-page').css({'filter':'','zoom':''});
		},
		resetPages = function(){
			resetPageStruct();
			resetCSS();
		},		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// ANIMATION FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		next = function(){
			if(!isBusy){
				gotoPage(options.curr+2);
			}
		},
		prev = function(){
			if(!isBusy){
				gotoPage(options.curr-2);
			}
		},
		gotoPage = function(num){
			//moving forward (increasing number)
			if(num > options.curr && num < options.pTotal && num >= 0 && !isBusy){
				isBusy = true;
				diff = num - options.curr;
				options.curr = num;
				options.before.call(this, options);
				updatePager();
				if(num == options.pTotal-2){updateCtrls();}
				updateHash(options.curr+1, options);
				initAnim(diff, true, sF);
		
				//hide p2 as p3 moves across it
				if(options.closed && options.autoCenter && num-diff == 0){
					p2.stop().animate({width:0, left:options.pWidth}, options.speed, options.easing);
					p4.stop().animate({left:options.pWidth}, options.speed, options.easing);
				}else{
					p2.stop().animate({width:0}, options.speedH, options.easeIn);
				}
			
				//animate p3 from right to left (left: movement, width: reveal slide, paddingLeft: shadow underneath)
				//call setuppages at end of animation to reset pages
				p3.stop().animate({left:options.pWidthH, width:options.pWidthH, paddingLeft: options.shadowBtmWidth}, options.speedH, options.easeIn)
						 .animate({left:0, width:options.pWidth, paddingLeft:0}, options.speedH, options.easeOut);			
				p3wrap.animate({left:options.shadowBtmWidth}, options.speedH, options.easeIn)
					  .animate({left:0}, options.speedH, options.easeOut, function(){updateAfter()});				
			
			//moving backward (decreasing number)
			}else if(num < options.curr && num < options.pTotal && num >= 0 && !isBusy){
				isBusy = true;
				diff = options.curr - num;
				options.curr = num;
				options.before.call(this, options);
				updatePager();
				if(num == 0){updateCtrls();}
				updateHash(options.curr+1, options);
				initAnim(diff, false, sB);
			
				//hide p1 as p0 moves across it
				p1.animate({left:options.pWidth, width:0}, options.speed, options.easing);
				p1wrap.animate({left:options.pWidthN}, options.speed, options.easing);
			
				//animate p0 from left to right (right: movement, width: reveal slide, paddingLeft: shadow underneath)
				if(options.closed && options.autoCenter && options.curr == 0){
					p0.animate({left:options.pWidthH, width:options.pWidthH}, options.speedH, options.easeIn)
					  .animate({left:0, width:options.pWidth}, options.speedH, options.easeOut);
					p2.stop().animate({left:0}, options.speed, options.easing);
				}else{
					p0.animate({left:options.pWidthH, width:options.pWidthH}, options.speedH, options.easeIn)
					  .animate({left:options.pWidth, width:options.pWidth}, options.speedH, options.easeOut);
				}
				//animate .wrapper content with p0 to keep content right aligned throughout
				//call setuppages at end of animation to reset pages
				p0wrap.animate({right:options.shadowBtmWidth}, options.speedH, options.easeIn)
					  .animate({right:0}, options.speedH, options.easeOut, function(){updateAfter()});					
		
			}
		}, 
		initAnim = function(diff, inc, shadow){			
			//setup content
			if(inc && diff > 2){
				//target.find('.b-page-'+(p3.data('page')-1)).after(p3.detach());	
				//target.find('.b-page-'+(p4.data('page')-1)).after(p4.detach());	
			
				target.find('.b-p3, .b-p4').removeClass('b-p3 b-p4').hide();
				target.find('.b-page-'+options.curr).addClass('b-p3').show().stop().css({'left':options.pWidth*2, 'width':0, 'height':options.pHeight, paddingLeft:0});
				target.find('.b-page-'+(options.curr+1)).addClass('b-p4').show().css({'left':options.pWidth, 'width':options.pWidth, 'height':options.pHeight});
				target.find('.b-page-'+options.curr+' .b-wrap').show().css({'width':options.pWidth-(options.pagePadding*2), 'height':options.pHeight-(options.pagePadding*2), 'padding': options.pagePadding});
				target.find('.b-page-'+(options.curr+1)+' .b-wrap').show().css({'width':options.pWidth-(options.pagePadding*2), 'height':options.pHeight-(options.pagePadding*2), 'padding': options.pagePadding});

				p3     = target.find('.b-p3');
				p4     = target.find('.b-p4');
				p3wrap = target.find('.b-p3 .b-wrap');
				p4wrap = target.find('.b-p4 .b-wrap');
		
				if(options.closed && options.autoCenter && options.curr-diff == 0){
					p3.css({'left':options.pWidth});
					p4.css({'left':0});
				}	
					
				//p1.after(p4.detach());
				//p2.after(p3.detach());
			
				if (options.shadows) {
					target.find('.b-shadow-f').remove();
					sF = $('<div class="b-shadow-f"></div>').css({
						'right': 0,
						'width': options.pWidth,
						'height': options.pHeight
					}).appendTo(p3);
					shadow = sF;
				}	
			
			}else if(!inc && diff > 2){
			
				//target.find('.b-page-'+(pN.data('page')-1)).after(pN.detach());
				//target.find('.b-page-'+(p0.data('page')-1)).after(p0.detach());

				target.find('.b-pN, .b-p0').removeClass('b-pN b-p0').hide();
				target.find('.b-page-'+options.curr).addClass('b-pN').show().css({'left':0, 'width':options.pWidth, 'height':options.pHeight});
				target.find('.b-page-'+(options.curr+1)).addClass('b-p0').show().css({'left':0, 'width':0, 'height':options.pHeight});
				target.find('.b-page-'+options.curr+' .b-wrap').show().css({'width':options.pWidth-(options.pagePadding*2), 'height':options.pHeight-(options.pagePadding*2), 'padding': options.pagePadding});
				target.find('.b-page-'+(options.curr+1)+' .b-wrap').show().css({'width':options.pWidth-(options.pagePadding*2), 'height':options.pHeight-(options.pagePadding*2), 'padding': options.pagePadding});
			
				pN     = target.find('.b-pN');
				p0     = target.find('.b-p0');
				pNwrap = target.find('.b-pN .b-wrap');
				p0wrap = target.find('.b-p0 .b-wrap');
		
				if(options.closed && options.autoCenter){
					pN.css({'left':0});
				}
				p0wrap.css({'right':0,'left':'auto'});	
									
				//p0.detach().appendTo(target);
			
				if (options.shadows) {
					target.find('.b-shadow-b, .b-shadow-f').remove();
					sB = $('<div class="b-shadow-b"></div>').appendTo(p0).css({
						'left': 0,
						'width': options.pWidth,
						'height': options.pHeight
					});
					shadow = sB;
				}
			}
		
			//update page visibility
			//if moving to start and end of book
			if(options.closed){
				if(!inc && options.curr == 0){
					pN.hide();
				}else if(!inc){
					pN.show();
				}
				if(inc && options.curr >= options.pTotal-2){
					p4.hide();
				}else if(inc){
					p4.show();
				}
			}
		
			//init shadows
			if(options.shadows){
				//check for opacity support -> animate shadow overlay on moving slide
				if($.support.opacity){
					shadow.animate({opacity:1}, options.speedH, options.easeIn)
						  .animate({opacity:0}, options.speedH, options.easeOut);
				}else{
					if(inc){
						shadow.animate({right:options.shadowTopFwdWidth}, options.speed, options.easeIn);
					}else{
						shadow.animate({left:options.shadowTopBackWidth}, options.speed, options.easeIn);
					}
				}
			}
		
			//init position anim
			if(options.closed && options.autoCenter){
				if(options.curr == 0){
					p3.hide();
					p4.hide();
					target.animate({width:options.pWidth}, options.speed, options.easing);
				}else if(options.curr >= options.pTotal-2){
					p0.hide();
					pN.hide();
					target.animate({width:options.pWidth}, options.speed, options.easing);
				}else{
					target.animate({width:options.width}, options.speed, options.easing);
				}
			}
		
		},
		updateAfter = function(){
			resetPages();
			updatePager();
			options.after.call(this, options);
			updateCtrls();
			isBusy = false;
		
			//update auto play timer
			if(options.auto && options.delay){
				if(playing && options.curr < options.pTotal-2){
					clearTimeout(a);
					a = setTimeout(function(){next();},options.delay);
					console.log("continue...");
				}
				if(options.curr >= options.pTotal-2){
					playing = false;
				}
			}
		},
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// OPTION / CONTROL FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		initOptions = function(){
			options.pTotal  = target.children().length;
			//setup page sizes
			if(!isInit){
				//set width + height
				if(!options.width){
					options.width = target.width();
				}else if(typeof options.width == 'string' && options.width.indexOf("%") != -1){
					options.wPercent = true;
					options.wOrig = options.width;
					options.width  = (options.width.replace('%','')/100) * parseFloat(target.parent().css('width'));
				}
				if(!options.height){
					options.height = target.height();
				}else if(typeof options.height == 'string' && options.height.indexOf("%") != -1){
					options.hPercent = true;
					options.hOrig = options.height;
					options.height  = (options.height.replace('%','')/100) * parseFloat(target.parent().css('height'));
				}
				target.width(options.width);
				target.height(options.height);
			
				//save page sizes and other vars
				options.pWidth  = options.width/2;
				options.pWidthN = '-'+(options.pWidth)+'px';
				options.pWidthH = options.pWidth/2;
				options.pHeight = options.height;
				options.speedH  = options.speed/2;

				options.curr = 0;
				//set startingPage
				/*if(options.direction == 'LTR'){
					options.curr = 0;
				}else if(options.direction == 'RTL'){
					options.curr = options.pTotal-2;
				}*/
				
				if(!isNaN(options.startingPage) && options.startingPage <= options.pTotal && options.startingPage > 0){
					if((options.startingPage % 2) != 0){options.startingPage--};
					options.curr = options.startingPage;
				}
			
				//set position
				if(options.closed && options.autoCenter){
					if(options.curr == 0){
						target.width(options.pWidth);
					}else if(options.curr >= options.pTotal-2){
						target.width(options.pWidth);
					}
				}
			
				//set booklet options.name
				if(options.name){
					document.title = options.name;
				}else{
					options.name = document.title;
				}
			
				//save shadow widths for anim
				if(options.shadows){
					options.shadowTopFwdWidth  = '-'+options.shadowTopFwdWidth+'px';
					options.shadowTopBackWidth = '-'+options.shadowTopBackWidth+'px';
				}
			}
		
			//setup menu
			if(options.menu){
				menu = $(options.menu).addClass('b-menu');
				p = options.curr;		
				//setup page selctor
				if(options.pageSelector){
					//add selector
					dd = $('<div class="b-selector b-selector-page"><span class="b-current">'+ (p+1) +' - '+ (p+2) +'</span></div>').appendTo(menu);
					ddUL = $('<ul></ul>').appendTo(dd).empty().css('height','auto');
	
					//loop through all pages
					for(i=0; i < options.pTotal; i+=2){
						j = i;
						//nums for normal view
						nums = (j+1) +'-'+ (j+2);
						if(options.closed){
							//nums for closed book
							j--;
							if(i==0){nums='1'}
							else if(i==options.pTotal-2){nums=options.pTotal-2}
							else {nums = (j+1) +'-'+ (j+2);}
							//nums for closed book with covers
							if(options.covers){
								j--;
								if(i==0){nums=''}
								else if(i==options.pTotal-2){nums=''}
								else {nums = (j+1) +'-'+ (j+2);}
							}
						}
						//nums for RTL direction
						if(options.direction == 'RTL'){
							nums = (Math.abs(j - options.pTotal)-1) +' - '+ ((Math.abs(j - options.pTotal)));
							if(options.closed){
								if(i==options.pTotal-2){nums='1'}
								else if(i==0){nums=options.pTotal-2}
								else{nums = (Math.abs(j - options.pTotal)-3) +' - '+ ((Math.abs(j - options.pTotal)-2));}
							
								if(options.covers){
									if(i==options.pTotal-2){nums=''}
									else if(i==0){nums=''}
									else{nums = (Math.abs(j - options.pTotal)-5) +' - '+ ((Math.abs(j - options.pTotal)-4));}
								}
							}
							dd.find('.b-current').text(nums);
							ddLI = $('<li><a href="#/page/'+ (i+1) +'" id="selector-page-'+i+'"><span class="b-text">'+ titles[i+1] +'</span><span class="b-num">'+ nums +'</span></a></li>').prependTo(ddUL);
						}else{
							if(i==0){dd.find('.b-current').text(nums);}
							ddLI = $('<li><a href="#/page/'+ (i+1) +'" id="selector-page-'+i+'"><span class="b-text">'+ titles[i] +'</span><span class="b-num">'+ nums +'</span></a></li>').appendTo(ddUL);
						}
					
						ddA = ddLI.find('a');
						if(!options.hash){
							ddA.click(function(){
								if(options.direction == 'RTL'){dd.find('.b-current').text($(this).find('.b-num').text());}
								ddT = parseInt($(this).attr('id').replace('selector-page-',''));
								gotoPage(ddT);
								return false;
							});
						}
					}
				
					//set height
					ddH = ddUL.height();
					ddUL.css({'height':0, 'padding-bottom':0});
				
					//add hover effects
					dd.unbind('hover').hover(function(){
						ddUL.stop().animate({height:ddH, paddingBottom:10}, 500);
					},function(){
						ddUL.stop().animate({height:0, paddingBottom:0}, 500);
					});
				}
			
				//setup chapter selctor
				if(options.chapterSelector){
				
					chapter = chapters[options.curr];
					if(chapter == ""){ chapter = chapters[options.curr+1]; }
				
					ddC = $('<div class="b-selector b-selector-chapter"><span class="b-current">'+chapter+'</span></div>').appendTo(menu);
					ddCUL = $('<ul></ul>').appendTo(ddC).empty().css('height','auto');
	
					for(i=0; i < options.pTotal; i+=1){
						if(chapters[i] != "" && typeof chapters[i] != "undefined"){
							if(options.direction == 'RTL'){
								j = i;
								if(j % 2 != 0){j--;}
								ddC.find('.b-current').text(chapters[i]);
								ddCLI = $('<li><a href="#/page/'+ (j+1) +'" id="selector-page-'+(j)+'"><span class="b-text">'+ chapters[i] +'</span></a></li>').prependTo(ddCUL);
							}else{
								ddCLI = $('<li><a href="#/page/'+ (i+1) +'" id="selector-page-'+i+'"><span class="b-text">'+ chapters[i] +'</span></a></li>').appendTo(ddCUL);
							}
							ddCA = ddCLI.find('a');
							if(!options.hash){
								ddCA.click(function(){
									if(options.direction == 'RTL'){ddC.find('.b-current').text($(this).find('.b-text').text());}
									ddCT = parseInt($(this).attr('id').replace('selector-page-',''));
									gotoPage(ddCT);
									return false;
								});
							}
						}
					}
				
					ddCH = ddCUL.height();
					ddCUL.css({'height':0, 'padding-bottom':0});
				
					ddC.unbind('hover').hover(function(){
						ddCUL.stop().animate({height:ddCH, paddingBottom:10}, 500);
					},function(){
						ddCUL.stop().animate({height:0, paddingBottom:0}, 500);
					});
				}
			}	
		
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// CONTROLS
			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
			ctrls = $('<div class="b-controls"></div>').appendTo(target);

			if(!isInit){
				if(options.manual){
					options.overlays = false;
				}			
				//add prev next user defined controls
				if(options.next){
					next = $(options.next);	
					next.click(function(e){e.preventDefault(); next();});
				}
				if(options.prev){
					prev = $(options.prev);	
					prev.click(function(e){e.preventDefault(); prev();});
				}
			}
		
			//add overlays
			if(options.overlays){
				overlayP = $('<div class="b-overlay b-overlay-prev b-prev" title="Previous Page"></div>').appendTo(ctrls);
				overlayN = $('<div class="b-overlay b-overlay-next b-next" title="Next Page"></div>').appendTo(ctrls);
				overlaysB = target.find('.b-overlay');
		
				if ($.browser.msie) {
					overlaystarget.css({'background':'#fff','filter':'progid:DXImageTransform.Microsoft.Alpha(opacity=0) !important'});
				}
			}
		
			//add tabs
			if(options.tabs){
				tabP = $('<div class="b-tab b-tab-prev b-prev" title="Previous Page">Previous</div>').appendTo(ctrls);
				tabN = $('<div class="b-tab b-tab-next b-next" title="Next Page">Next</div>').appendTo(ctrls);
				tabs = target.find('.b-tab');
			
				if(options.tabWidth){
					tabs.width(options.tabWidth);
				}
				if(options.tabHeight){
					tabs.height(options.tabHeight);
				}		
			
				tabs.css({'top': '-'+tabN.outerHeight()+'px'});
				target.css({'marginTop': tabN.outerHeight()});
			
				//update ctrls for RTL direction
				if(options.direction == 'RTL'){
					tabN.html('Previous').attr('title','Previous Page');
					tabP.html('Next').attr('title','Next Page');
				}
			}else{
				target.css({'marginTop': 0});
			}
		
			//add arrows
			if(options.arrows){
				arrowP = $('<div class="b-arrow b-arrow-prev b-prev" title="Previous Page"><div>Previous</div></div>').appendTo(ctrls);
				arrowN = $('<div class="b-arrow b-arrow-next b-next" title="Next Page"><div>Next</div></div>').appendTo(ctrls);
				arrows = target.find('.b-arrow');
			
				//update ctrls for RTL direction
				if(options.direction == 'RTL'){
					arrowN.html('<div>Previous</div>').attr('title','Previous Page');
					arrowP.html('<div>Next</div>').attr('title','Next Page');
				}
			}
		
			//add corner-peels
			if(options.peels){
				peelP = $('<div class="b-peel b-peel-prev" title="Previous Page"><img src="'+options.peelPrevIMG+'" alt="" /></div>').appendTo(ctrls);
				peelN = $('<div class="b-peel b-peel-next" title="Next Page"><img src="'+options.peelNextIMG+'" alt="" /></div>').appendTo(ctrls);
				peels = target.find('.b-peel');
				peel_IMGs = target.find('.b-peel img').width(0);
				peelP_IMG = target.find('.b-peel-prev img');
				peelN_IMG = target.find('.b-peel-next img');
			
				var origPos = '';
				peelN_IMG.bind('mousedown touchstart MozTouchDown', function(e){
				    if(e.originalEvent.touches && e.originalEvent.touches.length) {
				        e = e.originalEvent.touches[0];
				    } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
				        e = e.originalEvent.changedTouches[0];
				    }
					e.preventDefault(); 
					origPos = e.pageX;
					$(this).bind('mousemove touchmove MozTouchMove', function(e){
					    if(e.originalEvent.touches && e.originalEvent.touches.length) {
					        e = e.originalEvent.touches[0];
					    } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
					        e = e.originalEvent.changedTouches[0];
					    }								
						e.preventDefault(); 
						if(origPos != ''){
							var newPos = e.pageX;
							var newSize = options.peelSize + (1.5*options.peelSize) * (origPos - newPos)/100;
							$(this).width(newSize);
							$(this).height(newSize);
							$(this).parent().width(newSize);
							$(this).parent().height(newSize);
						}
					}).bind('click mouseup mouseleave touchend MozTouchRelease', function(){
						e.preventDefault(); 
						if(origPos != ''){
							origPos = '';
							hoverAnimEnd(true);
							$(this).unbind('click mouseup mouseleave mousemove touchmove MozTouchMove touchend MozTouchRelease');
							next();
						}
					});	
				});	
			
				peelP_IMG.bind('mousedown touchstart MozTouchDown', function(e){
				    if(e.originalEvent.touches && e.originalEvent.touches.length) {
				        e = e.originalEvent.touches[0];
				    } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
				        e = e.originalEvent.changedTouches[0];
				    }
					e.preventDefault(); 
					origPos = e.pageX;
					$(this).bind('mousemove touchmove MozTouchMove', function(e){
					    if(e.originalEvent.touches && e.originalEvent.touches.length) {
					        e = e.originalEvent.touches[0];
					    } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
					        e = e.originalEvent.changedTouches[0];
					    }
						e.preventDefault(); 
						if(origPos != ''){
							var newPos = e.pageX;
							var newSize = options.peelSize + (1.5*options.peelSize) * (newPos - origPos)/100;
							$(this).width(newSize);
							$(this).height(newSize);
							$(this).parent().width(newSize);
							$(this).parent().height(newSize);
						}
					}).bind('click mouseup mouseleave touchend MozTouchRelease', function(e){
						e.preventDefault(); 
						if(origPos != ''){
							origPos = '';
							hoverAnimEnd(false);
							$(this).unbind('click mouseup mouseleave mousemove touchmove MozTouchMove touchend MozTouchRelease');
							prev();
						}
					});	
				});	
			
				//mousetracking for page movement
				$(target).bind('mouseenter',function(e){
					$(this).bind('mousemove touchmove MozTouchMove',function(e){
					    if(e.originalEvent.touches && e.originalEvent.touches.length) {
					        e = e.originalEvent.touches[0];
					    } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
					        e = e.originalEvent.changedTouches[0];
					    }
						if(!isBusy){
							relativeX = e.pageX - target.offset().left;
							if(relativeX < options.pagePadding && (options.closed && options.curr != 0)){
								hoverAnimStart(false);
								$(target).bind('click',function(e){e.preventDefault(); prev();});
							}else if(relativeX > options.pWidth-options.pagePadding && options.curr == 0 && options.autoCenter && options.closed){
								hoverAnimStart(true);
								$(target).bind('click',function(e){e.preventDefault(); next();});
							}else if(relativeX > options.pagePadding && relativeX < options.width-options.pagePadding){
								hoverAnimEnd(false);
								hoverAnimEnd(true);
								$(target).unbind('click');
							}else if(relativeX > options.width-options.pagePadding){
								hoverAnimStart(true);
								$(target).bind('click',function(e){e.preventDefault(); next();});
							}
						}
					});
				}).bind('mouseleave',function(e){
					hoverAnimEnd(false);
					hoverAnimEnd(true);
					$(this).unbind('mousemove touchmove MozTouchMove');
				});
			
			}
		
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
			//save all "b-prev" and "b-next" controls
			ctrlsN = ctrls.find('.b-next');
			ctrlsP = ctrls.find('.b-prev');
		
			//add click actions
			ctrlsN.bind('click',function(e){e.preventDefault(); next();});
			ctrlsP.bind('click',function(e){e.preventDefault(); prev();});
		
			//add page hover animations
			if(options.overlays && options.hovers){
				//hovers to start draggable forward
				ctrlsN.unbind("mouseover mouseout").bind("mouseover",function(){
					hoverAnimStart(true);
				})
				.bind("mouseout",function(){
					hoverAnimEnd(true);
				});
			
				//hovers to start draggable backwards
				ctrlsP.unbind("mouseover mouseout").bind("mouseover",function(){
					hoverAnimStart(false);
				})
				.bind("mouseout",function(){
					hoverAnimEnd(false);
				});
			}
				
			//arrow animations	
			if(options.arrows){
				if(options.arrowsHide){
					if($.support.opacity){
						ctrlsN.hover(
							function(){arrowN.find('div').stop().fadeTo('fast', 1);},
							function(){arrowN.find('div').stop().fadeTo('fast', 0);					
						});
						ctrlsP.hover(
							function(){arrowP.find('div').stop().fadeTo('fast', 1);},
							function(){arrowP.find('div').stop().fadeTo('fast', 0);					
						});
					}else{
						ctrlsN.hover(
							function(){arrowN.find('div').show();},
							function(){arrowN.find('div').hide();					
						});
						ctrlsP.hover(
							function(){arrowP.find('div').show();},
							function(){arrowP.find('div').hide();					
						});
					}
				}else{
					arrowN.find('div').show();
					arrowP.find('div').show();
				}
			}
	
			if(!isInit){
				//keyboard ctrls
				if(options.keyboard){
					//keyboard ctrls
					$(document).keyup(function(event){
						if(event.keyCode == 37){prev();}
						else if(event.keyCode == 39){next();}
					});
				}
				
				//hash ctrls
				if(options.hash){
					setupHash();
					clearInterval(h);
					h = setInterval(function(){pollHash()}, 250);
				}
			
				//percentage resizing
				if(options.wPercent || options.hPercent){
					$(window).resize(function() {
						resetSize();
					});
				}
			
				//auto flip book controls
				if(options.auto && options.delay){
					clearTimeout(a);
					a = setTimeout(function(){next();},options.delay);
					playing = true;
				
					if(options.pause){
						pause = $(options.pause);	
						pause.click(function(e){
							e.preventDefault(); 
							if(playing){
								clearTimeout(a);
								playing = false;
							}
						});
					}
					if(options.play){
						play = $(options.play);	
						play.click(function(e){
							e.preventDefault(); 
							if(!playing){
								clearTimeout(a);
								a = setTimeout(function(){next();},options.delay);
								playing = true;
							}
						});
					}
				}
			}
		},
		resetSize = function(){
			//recalculate size for percentage values
			if(options.wPercent){
				options.width  = (options.wOrig.replace('%','')/100) * parseFloat(target.parent().css('width'));
				target.width(options.width);
				options.pWidth  = options.width/2;
				options.pWidthN = '-'+(options.pWidth)+'px';
				options.pWidthH = options.pWidth/2;
			}
			if(options.hPercent){
				options.height  = (options.hOrig.replace('%','')/100) * parseFloat(target.parent().css('height'));
				target.height(options.height);
				options.pHeight = options.height;
			}
			resetCSS();
		},
		// PAGE PEEL ANIMATIONS
		hoverAnimStart = function(inc){
			if(!isBusy){
				$(target).css('cursor',options.cursor);
				if(inc && !isHoveringRight){
					peelN.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
					peelN_IMG.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
					isHoveringRight = true;
				}else if(!inc && !isHoveringLeft){
					peelP.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
					peelP_IMG.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
					isHoveringLeft = true;
				}
			}
		},
		hoverAnimEnd = function(inc){
			$(target).css('cursor','default');
			if(inc && isHoveringRight){
				peelN.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
				peelN_IMG.stop().animate({'width':0,'height':0}, 200, "easeOutExpo");
				isHoveringRight = false;
			}else if(!inc && isHoveringLeft){
				peelP.stop().animate({'width':options.peelSize,'height':options.peelSize}, 200, "easeOutExpo");
				peelP_IMG.stop().animate({'width':0,'height':0}, 200, "easeOutExpo");
				isHoveringLeft = false;
			}
		},
		updateCtrls = function(){
			//update ctrls, cursors and visibility
			if(options.overlays || options.tabs || options.arrows){
				if($.support.opacity){
					if(options.curr >= 2 && options.curr != 0){           
						ctrlsP.fadeIn('fast').css('cursor',options.cursor);
					}else{
						ctrlsP.fadeOut('fast').css('cursor','default'); 
					}
					if(options.curr < options.pTotal-2){
						ctrlsN.fadeIn('fast').css('cursor',options.cursor);
					}else{
						ctrlsN.fadeOut('fast').css('cursor','default'); 
					}
				}else{
					if(options.curr >= 2 && options.curr != 0){           
						ctrlsP.show().css('cursor',options.cursor);
					}else{
						ctrlsP.hide().css('cursor','default'); 
					}
					if(options.curr < options.pTotal-2){
						ctrlsN.show().css('cursor',options.cursor);
					}else{
						ctrlsN.hide().css('cursor','default'); 
					}
				}
			}
		
			if(options.peels){
				hoverAnimEnd(false);
				hoverAnimEnd(true);
			
				peelN_IMG.attr('src',options.peelNextIMG);
				peelP_IMG.attr('src',options.peelPrevIMG);
			
				peels.width(options.peelSize).height(options.peelSize);
			
				if(options.curr == 2){           
					peelP_IMG.attr('src',options.peelPrevEndIMG);
				}
				if(options.curr == options.pTotal-4){
					peelN_IMG.attr('src',options.peelNextEndIMG);
				}
			}
		},
		updatePager = function(){
			if(options.pageSelector){
				if(options.direction == 'RTL'){
					nums = (Math.abs(options.curr - options.pTotal)-1) +' - '+ ((Math.abs(options.curr - options.pTotal)));
					if(options.closed){
						if(options.curr==options.pTotal-2){nums='1'}
						else if(options.curr==0){nums=options.pTotal-2}
						else{nums = (Math.abs(options.curr - options.pTotal)-2) +' - '+ ((Math.abs(options.curr - options.pTotal)-1));}
					
						if(options.covers){
							if(options.curr==options.pTotal-2){nums=''}
							else if(options.curr==0){nums=''}
							else{nums = (Math.abs(options.curr - options.pTotal)-3) +' - '+ ((Math.abs(options.curr - options.pTotal)-2));}
						}
					}
					$(options.menu+' .b-selector-page .b-current').text(nums);
				}else{
					nums = (options.curr+1) +' - '+ (options.curr+2);
					if(options.closed){
						if(options.curr==0){nums='1'}
						else if(options.curr==options.pTotal-2){nums=options.pTotal-2}
						else {nums = (options.curr) +'-'+ (options.curr+1);}
					
						if(options.covers){
							if(options.curr==0){nums=''}
							else if(options.curr==options.pTotal-2){nums=''}
							else {nums = (options.curr-1) +'-'+ (options.curr);}
						}
					}
					$(options.menu+' .b-selector-page .b-current').text(nums);
				}
			}
			if(options.chapterSelector){
				if(chapters[options.curr]!=""){
					$(options.menu+' .b-selector-chapter .b-current').text(chapters[options.curr]);
				}else if(chapters[options.curr+1]!=""){
					$(options.menu+' .b-selector-chapter .b-current').text(chapters[options.curr+1]);
				}
			
				if(options.direction == 'RTL' && chapters[options.curr+1]!=""){
					$(options.menu+' .b-selector-chapter .b-current').text(chapters[options.curr+1]);
				}else if(chapters[options.curr]!=""){
					$(options.menu+' .b-selector-chapter .b-current').text(chapters[options.curr]);
				}
			}
		},
		// HASH FUNCTIONS	
		setupHash = function(){
			hash = getHashNum();
		
			if(!isNaN(hash) && hash <= options.pTotal-1 && hash >= 0 && hash != ''){
				if((hash % 2) != 0){
					hash--;
				}
				options.curr = hash;
			}else{
				updateHash(options.curr+1, options);
			}
		
			currhash = hash;
		},
		pollHash = function(){
			hash = getHashNum();
			//check page num
			if(!isNaN(hash) && hash <= options.pTotal-1 && hash >= 0){
				if(hash != options.curr && hash.toString()!=currhash){
					if((hash % 2) != 0){hash--};
				
					document.title = options.name + " - Page "+ (hash+1);
				
					if(!isBusy){
						gotoPage(hash);
						currhash = hash;
					}
				}
			}
		},
		getHashNum = function(){
			//get page number from hash tag, last element
			var hash = window.location.hash.split('/');
			if(hash.length > 1){
				return parseInt(hash[2])-1;
			}else{
				return '';
			}
		},
		updateHash = function(hash, options){
			//set the hash
			if(options.hash){
				window.location.hash = "/page/" + hash;
			}
		},
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// DYNAMIC FUNCTIONS	
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		addPage = function(index, html){
			//validate inputs
			if(index == "start"){
				index = 0;
			}else if(index == "end"){
				index = target.data('total');
			}else if(typeof index == "number" ){
				if(index < 0 || index > target.data('total')){
					return;
				}
			}else if(typeof index == "undefined"){
				return;
			}
		
			if(typeof html == "undefined" || html == ''){
				return;
			}
		
			//remove booklet markup
			target.find(".b-wrap").unwrap();
			target.find(".b-wrap").children().unwrap();
			target.find(".b-page-blank, .b-page-empty, .b-shadow-f, .b-shadow-b").remove();
		
			//remove generated controls
			ctrls.remove();
			ctrls = null;
		
			if(options.menu && options.pageSelector){
				ddUL.remove();
				ddUL = null;
			}
			if(options.menu && options.chapterSelector){
				ddCUL.remove();
				ddCUL = null;
			}
		
		
			//add new page
			if(options.closed && options.covers && index == target.data('total')){
				//end of closed-covers book
				target.children(':eq('+(index-1)+')').before(html);
			}else if(options.closed && options.covers && index == 0){
				//start of closed-covers book
				target.children(':eq('+index+')').after(html);
			}else if(index == target.data('total')){
				//end of book
				target.children(':eq('+(index-1)+')').after(html);
			}else{
				target.children(':eq('+index+')').before(html);
			}
				
			//recall initialize funcitons		
			initPages();
		}
	
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			// PUBLIC FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		return {
			init:     init,
			next:     next,
			prev:     prev,
			gotoPage: gotoPage,
			addPage:  addPage,
			options:  options,
			pages:    pages
		};
	}

	//define default options
	$.fn.booklet.defaults = {
		name:               null,                            // name of the booklet to display in the document title bar
		width:              600,                             // container width
		height:             400,                             // container height
		speed:              1000,                            // speed of the transition between pages
		direction:          'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
		startingPage:       0,                               // index of the first page to be displayed
		easing:             'easeInOutQuad',                 // easing method for complete transition
		easeIn:             'easeInQuad',                    // easing method for first half of transition
		easeOut:            'easeOutQuad',                   // easing method for second half of transition
	
		closed:             true,                           // start with the book "closed", will add empty pages to beginning and end of book
		closedFrontTitle:   null,                            // used with "closed", "menu" and "pageSelector", determines title of blank starting page
		closedFrontChapter: null,                            // used with "closed", "menu" and "chapterSelector", determines chapter name of blank starting page
		closedBackTitle:    null,                            // used with "closed", "menu" and "pageSelector", determines chapter name of blank ending page
		closedBackChapter:  null,                            // used with "closed", "menu" and "chapterSelector", determines chapter name of blank ending page
		covers:             false,                           // used with "closed", makes first and last pages into covers, without page numbers (if enabled)
		autoCenter:         false,                           // used with "closed", makes book position in center of container when closed

		pagePadding:        10,                              // padding for each page wrapper
		pageNumbers:        true,                           // display page numbers on each page
		pageBorder:         1,
	
		manual:             true,                            // enables manual page turning, requires jQuery UI to function
	
		peels:              false,
		peelSize:           50,	
		peelNextIMG:        '/images/editor/peel-next.png',
		peelPrevIMG:        '/images/editor/peel-prev.png',	
		peelNextEndIMG:     '/images/editor/peel-next-end-white.png',
		peelPrevEndIMG:     '/images/editor/peel-prev-end-white.png',	
		
		hovers:             true,                            // enables preview pageturn hover animation, shows a small preview of previous or next page on hover
		overlays:           true,                            // enables navigation using a page sized overlay, when enabled links inside the content will not be clickable
		tabs:               false,                           // adds tabs along the top of the pages
		tabWidth:           60,                              // set the width of the tabs
		tabHeight:          20,                              // set the height of the tabs
		arrows:             false,                           // adds arrows overlayed over the book edges
		arrowsHide:         false,                           // auto hides arrows when controls are not hovered
		cursor:             'pointer',                       // cursor css setting for side bar areas
	
		hash:               false,                           // enables navigation using a hash string, ex: #/page/1 for page 1, will affect all booklets with 'hash' enabled
		keyboard:           true,                            // enables navigation with arrow keys (left: previous, right: next)
		next:               null,                            // selector for element to use as click trigger for next page
		prev:               null,                            // selector for element to use as click trigger for previous page
		auto:               false,                           // enables automatic navigation, requires "delay"
		delay:              5000,                            // amount of time between automatic page flipping
		pause:              null,                            // selector for element to use as click trigger for pausing auto page flipping
		play:               null,                            // selector for element to use as click trigger for restarting auto page flipping

		menu:               null,                            // selector for element to use as the menu area, required for 'pageSelector'
		pageSelector:       false,                           // enables navigation with a dropdown menu of pages, requires 'menu'
		chapterSelector:    false,                           // enables navigation with a dropdown menu of chapters, determined by the "rel" attribute, requires 'menu'

		shadows:            true,                            // display shadows on page animations
		shadowTopFwdWidth:  166,                             // shadow width for top forward anim
		shadowTopBackWidth: 166,                             // shadow width for top back anim
		shadowBtmWidth:     50,                              // shadow width for bottom shadow
	
		before:             function(){},                    // callback invoked before each page turn animation
		after:              function(){}                     // callback invoked after each page turn animation
	}
	
})(jQuery);