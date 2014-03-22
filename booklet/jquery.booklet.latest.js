/*
 * jQuery Booklet Plugin
 * Copyright (c) 2010 - 2014 William Grauvogel (http://builtbywill.com/)
 *
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version : 2.0.0
 *
 */
;(function ($) {

    var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1],
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1],
        prefix = {
            dom: dom,
            lowercase: pre,
            css: '-' + pre + '-',
            js: pre[0].toUpperCase() + pre.substr(1)
        },
        browserPrefix = function(style){ return prefix.css + style;},

        // Private Constants

        bookletClass         = 'booklet',
        pageClass            = 'b-page',
        pageBlankClass       = pageClass + '-blank',
        pageTransparentClass = pageClass + '-transparent',
        shadowClass          = 'b-shadow',
        wrapperClass         = 'b-wrapper',

        bookletStyle    = browserPrefix('perspective')+':2000px; '+browserPrefix('perspective-origin')+':50% 50%; '+browserPrefix('transform-style')+':preserve-3d; '+browserPrefix('backface-visibility')+':hidden;',
        pageOddStyle    = browserPrefix('transform-origin')+':100% 0; background-image:'+browserPrefix('linear-gradient')+'(left, #fff 50%, #fafafa 95%, #f5f5f5);',
        pageEvenStyle   = 'left:50%; '+ browserPrefix('transform-origin')+':0 0; background-image:'+browserPrefix('linear-gradient')+'(right, #fff 50%, #fafafa 95%, #f5f5f5);',
        shadowOddStyle  = 'background-image:'+browserPrefix('radial-gradient')+'(right, circle, rgba(0,0,0,0.25) 10%, rgba(0,0,0,0) 70%)',
        shadowEvenStyle = 'background-image:'+browserPrefix('radial-gradient')+'(left, circle, rgba(0,0,0,0.25) 10%, rgba(0,0,0,0) 70%)',

        css = {
            page: {visibility:'hidden', zIndex:10},
            pageOuter: {zIndex: 10},
            pageInner: {zIndex: 30},
            pageVisible: {visibility: 'visible', zIndex: 20}
        },
        eventCreate      = 'bookletcreate',      // called when booklet has been created
        eventWillChange  = 'bookletwillchange',  // called when booklet will changes pages, before the DOM or CSS is updated
        eventStartChange = 'bookletstartchange', // called when booklet starts to change pages
        eventDidChange   = 'bookletdidchange',   // called when booklet has finished changing pages
        eventAdd         = 'bookletadd',         // called when booklet has added a page
        eventRemove      = 'bookletremove',      // called when booklet has removed a page
        eventNamespace   = '.booklet';           // eventNamespace for all internal events

    // Helpers

    function template(templateClass){
        return '<div class="'+templateClass+'"></div>';
    }
    function notUndefined(obj){
        return typeof obj !== 'undefined';
    }
    function notUndefinedAndNull(obj){
        return notUndefined(obj) && obj != null;
    }
    function isString(obj){
        return typeof obj === 'string';
    }
    function isNumber(obj){
        return typeof obj === 'number';
    }
    function isObject(obj){
        return typeof obj === 'object';
    }
    function isStringPX(input){
        return isString(input) && input.indexOf("px") != -1;
    }
    function pxStringToNum(string){
        return string.replace('px', '');
    }
    function isStringPercent(input){
        return isString(input) && input.indexOf("%") != -1;
    }
    function percentStringToNum(string, parentSize){
        return (string.replace('%', '') / 100) * parseFloat(parentSize);
    }
    function pxStringNeg(string){
        return '-' + string + 'px';
    }
    function deg(d){
        return d + 'deg';
    }
    function nDeg(d){
        return '-' + deg(d);
    }

    // Main Plugin Method

    $.fn.booklet = function (optionsOrMethod, param1, param2) {

        var booklet, params, output, result;

        // call a method by name
        if (isString(optionsOrMethod)) {

            result = [];

            // add optional parameters
            params = [];
            if (notUndefined(param1)) {
                params.push(param1);
            }
            if (notUndefined(param2)) {
                params.push(param2);
            }

            // loop each booklet, adding results to array
            $(this).each(function () {

                // get the Booklet
                booklet = $(this).data('booklet');

                // validate
                if (!booklet)
                    $.error('jquery.booklet has not been initialized. Method "' + optionsOrMethod + '" cannot be called.');
                if (!booklet[optionsOrMethod])
                    $.error('jquery.booklet: method "' + optionsOrMethod + '" does not exist.');

                // call the method
                output = booklet[optionsOrMethod].apply(booklet, params);
                if (notUndefined(output) || output) {
                    result.push(output);
                }
            });

            if (result.length == 1) {
                return result[0];
            }
            if (result.length > 0) {
                return result;
            }
            return $(this);
        }

        // build new booklet for each target
        return $(this).each(function () {

            // destroy old booklet object if it exists
            booklet = $(this).data('booklet');
            if (booklet) {
                booklet.destroy();
            }

            // instantiate new booklet
            booklet = new Booklet($(this), optionsOrMethod);

            // preserve chaining on main function
            return this;
        });
    };

    // Plugin Default Options
    
    $.fn.booklet.defaults = {
        width:          600,             // container width
        height:         400,             // container height
        speed:          500,             // speed of the transition between pages
        startingIndex:  0,               // index of the first page to be displayed
        easing:         'easeInOutQuad', // easing method for complete transition
        easeIn:         'easeInQuad',    // easing method for first half of transition
        easeOut:        'easeOutQuad',   // easing method for second half of transition
        shadows:        true,            // display shadows on page animations

        leftToRight:    true,            // direction of the overall content organization, left to right, can be false for languages which read right to left
        single:         false,           // displays a single page layout, where content provided is only shown on one side of the booklet. spacer pages are added and the booklet frame is reduced in width
        closed:         false,           // start with the book "closed", will add transparent pages to beginning and end of book
        autoCenter:     false,           // used with "closed", makes book position in center of container when closed

        swipe:          true,
        drag:           true,

        hovers:         true,            // enables page-turn hover animation
        hoverWidth:     50,              // default width for page-turn hover preview
        hoverSpeed:     500,             // default speed for page-turn hover preview
        hoverThreshold: 0.25,            // default percentage used for manual page dragging, sets the percentage amount a drag must be before moving next or prev

        overlays:       false,           // enables navigation by clicking anywhere in the booklet. when enabled links inside the content will not be clickable
        keyboard:       true,            // enables navigation with arrow keys (left: previous, right: next)

        create:         null,            // called when booklet has been created
        willchange:     null,            // called when booklet will changes pages, before the DOM or CSS is updated
        startchange:    null,            // called when booklet starts to change pages
        didchange:      null,            // called when booklet has finished changing pages
        add:            null,            // called when booklet has added a page
        remove:         null             // called when booklet has removed a page
    };

    // Page

    function Page(contentNode, index){
        this.index = index;
        this.contentNode = contentNode;
        this.isTransparent = this.contentNode.hasClass(pageTransparentClass);
        this.isBlank = this.contentNode.hasClass(pageBlankClass);
        this.pageNode = this.createPageNode();
        this.pageNode.attr('style', (index % 2) == 0 ? pageOddStyle : pageEvenStyle);
    }
    Page.prototype = {
        constructor: Page,
        createPageNode: function () {
            if (this.isBlank || this.isTransparent) {
                return this.contentNode;
            } else {
                return this.contentNode.wrap(template(pageClass)).parent();
            }
        },
        destroy: function () {
            if (this.isBlank || this.isTransparent)
                this.pageNode.remove();
            else
                this.contentNode.unwrap();
        }
    };

    // Booklet

    function Booklet(inTarget, inOptions) {
                
        var target = inTarget,
            options = $.extend({}, $.fn.booklet.defaults, inOptions),
            wrapper, pages = [], pN, p0, p1, p2, p3, p4,
            created = false, busy = false, hoveringRight = false, hoveringLeft = false, enabled = false, movingForward = false,
            diff, originalPageTotal, pageTotal, currentIndex,
            //p3drag, p0drag,
            percentWidthString, percentHeightString,
            shadowLeft1, shadowRight1, shadowLeft2, shadowRight2,

        // Helpers

            getInfo = function(){
                return {
                    target:target,
                    wrapper:wrapper,
                    options:$.extend({}, options),
                    pages:pages,
                    pageTotal:pageTotal,
                    originalPageTotal:originalPageTotal,
                    currentIndex:currentIndex,
                    created:created,
                    busy:busy,
                    hoveringRight:hoveringRight,
                    hoveringLeft:hoveringLeft,
                    enabled:enabled,
                    movingForward:movingForward
                };
            },
            triggerEvent = function(eventName, callback, index, eventPages){
                index = index || currentIndex;
                eventPages = eventPages || [pages[currentIndex], pages[currentIndex + 1]];

                target.off(eventName + eventNamespace);
                if (typeof callback === 'function') {
                    target.on(eventName + eventNamespace, callback);
                }
                target.trigger(eventName, {
                    info: getInfo(),
                    index: index,
                    pages: eventPages
                });
            },
            isLTR = function(){
                return options.leftToRight;
            },
            atBeginning = function(){
                return currentIndex == 0;
            },
            atEnd = function(){
                return currentIndex >= pageTotal - 2;
            },
            canGoBack = function(){
                return currentIndex - 2 >= 0;
            },
            canGoForward = function(){
                return currentIndex + 2 <= pageTotal - 2;
            },
            usingPercentageSize = function(){
                return notUndefinedAndNull(percentWidthString) || notUndefinedAndNull(percentHeightString);
            },
            pageWidth = function(){
                return options.width / 2;
            },
            pageWidthHalf = function(){
                return  pageWidth() / 2;
            },
            pageWidthNegative = function(){
                return pxStringNeg(pageWidth());
            },
            pageWidthHalfNegative = function(){
                return pxStringNeg(pageWidthHalf());
            },
            pageHeight = function(){
                return  options.height;
            },
            pageSize = function(){
                return {width:pageWidth(), height:pageHeight()};
            },
            pagesNotTransparent = function(){
                var notTransparent = [];
                $.each(pages, function(){
                    if (!this.isTransparent)
                        notTransparent.push(this);
                });
                return notTransparent;
            },
            shadows = function(){
                return [shadowLeft1, shadowLeft2, shadowRight1, shadowRight2];
            },
            reversePageOrder = function(){
                $(target.children().get().reverse()).each(function () {
                    $(this).appendTo(target);
                });
            },
            validatePageIndex = function(index){
                if (!notUndefinedAndNull(index))
                    return false;
                return !(isNumber(index) && (index < 0 || index > originalPageTotal));
            },

        // Main

            init = function () {

                // setup target DOM object
                target.addClass(bookletClass).attr('style', bookletStyle);
                // store data for api calls
                target.data('booklet', this);

                // save original number of pages
                originalPageTotal = target.children().length;
                currentIndex = 0;

                createShadows();
                createPages();
                updateOptions();
                updatePages();

                created = true;
                enabled = true;

                triggerEvent(eventCreate, options.create);
            },
            enable = function () {
                enabled = true;
            },
            disable = function () {
                enabled = false;
            },
            destroy = function () {

                removeControlActions();
                destroyPages();
                destroyWrapper();

                // clear class from target DOM object, reset width + height
                target.removeClass(bookletClass).removeAttr('style');
                // clear out booklet from data object
                target.removeData('booklet');

                created = false;
            },

        // Pages

            createPages = function () {
                pages = [];

                // single layout, add spacer pages
                if (options.single) {
                    target.children().each(function (i) {
                        if (!options.closed || i != 0){
                            if (isLTR()){
                                $(this).before(template(pageClass+' '+pageBlankClass));
                            } else {
                                $(this).after(template(pageClass+' '+pageBlankClass));
                            }
                        }
                    });
                }

                // fix for odd number of pages
                if ((target.children().length % 2) != 0) {
                    target.children().last().after(template(pageClass+' '+pageBlankClass));
                }

                // if closed book, add empty pages to start and end
                if (options.closed) {
                    target.prepend(template(pageClass+' '+pageTransparentClass));
                    target.append(template(pageClass+' '+pageTransparentClass));
                }

                // save total page count
                pageTotal = target.children().length;

                // reverse order
                if (!isLTR()) {
                    reversePageOrder();
                }

                // set currentIndex on first init
                if (!created) {
                    currentIndex = isLTR() ? 0 : pageTotal - 2;
                    if (!isNaN(options.startingIndex) && options.startingIndex <= pageTotal && options.startingIndex > 0) {
                        if ((options.startingIndex % 2) != 0) {
                            options.startingIndex--;
                        }
                        currentIndex = options.startingIndex;
                    }
                }

                // create pages
                target.children().each(function (i) {
                    var newPage = new Page($(this), i);
                    pages.push(newPage);
                });
            },
            updatePages = function () {

                removeShadows();

                // update active pages
                if (canGoBack()) {
                    pN = pages[currentIndex - 2].pageNode;
                    p0 = pages[currentIndex - 1].pageNode;
                }
                p1 = pages[currentIndex].pageNode;
                p2 = pages[currentIndex + 1].pageNode;
                if (canGoForward()) {
                    p3 = pages[currentIndex + 2].pageNode;
                    p4 = pages[currentIndex + 3].pageNode;
                }

                // css
                $.each(pages, function(){
                    this.pageNode.css(css.page);
                });
                if (pN) pN.css(css.pageOuter);
                if (p0) p0.css(css.pageInner);
                p1.css(css.pageVisible);
                p2.css(css.pageVisible);
                if (p3) p3.css(css.pageInner);
                if (p4) p4.css(css.pageOuter);
            },
            destroyPages = function () {

                removeShadows();

                $.each(pages, function(){
                    this.destroy();
                });
                pages = [];

                if (!isLTR()) {
                    reversePageOrder();
                }
            },

        // Shadows

            createShadows = function(){
                shadowLeft1  = $(template(shadowClass)).attr('style', shadowOddStyle);
                shadowLeft2  = $(template(shadowClass)).attr('style', shadowOddStyle);
                shadowRight1 = $(template(shadowClass)).attr('style', shadowEvenStyle);
                shadowRight2 = $(template(shadowClass)).attr('style', shadowEvenStyle);
            },
            addShadows = function (inc) {
                if ((inc && shadowLeft1.parent()[0] != p3[0]) || (!inc && shadowLeft1.parent()[0] != p1[0])) {
                    shadowLeft1.css({opacity:0}).appendTo(inc ? p3 : p1);
                }
                if ((inc && shadowRight1.parent()[0] != p2[0]) || (!inc && shadowRight1.parent()[0] != p0[0])) {
                    shadowRight1.css({opacity:0}).appendTo(inc ? p2: p0);
                }
                if ((inc && shadowLeft2.parent()[0] != p1[0]) || (!inc && shadowLeft2.parent()[0] != pN[0])) {
                    shadowLeft2.css({opacity:0}).appendTo(inc ? p1 : pN);
                }
                if ((inc && shadowRight2.parent()[0] != p4[0]) || (!inc && shadowRight2.parent()[0] != p2[0])) {
                    shadowRight2.css({opacity:0}).appendTo(inc ? p4: p2);
                }
            },
            removeShadows = function () {
                $.each(shadows(), function(){ this.remove() });
            },

        // Wrapper

            createWrapper = function(){
                if (target.parent().hasClass(wrapperClass)) {
                    wrapper = target.parent();
                } else {
                    wrapper = target.wrap(template(wrapperClass)).parent();
                }
            },
            destroyWrapper = function(){
                if (target.parent().hasClass(wrapperClass)){
                    target.unwrap();
                    wrapper = null;
                }
            },

        // Options

            updateOptions = function (newOptions) {

                var recreate = false;

                // update options if newOptions have been passed in
                if (notUndefinedAndNull(newOptions)) {

                    // copy current options, make updates
                    var currentOptions = $.extend({}, options),
                        size = false,
                        autoCenter = false;

                    // compare to see what changed
                    for (var name in newOptions) {
                        if (!newOptions.hasOwnProperty(name) || !currentOptions.hasOwnProperty(name)) continue;
                        var value = currentOptions[name];
                        var newValue = newOptions[name];
                        if (value != newValue) {
                            if (name == 'leftToRight' || name == 'single' || name == 'closed'){
                                recreate = true;
                                continue;
                            }
                            if (name == 'width' || name == 'height') {
                                size = true;
                            }
                            if (name == 'autoCenter' || name == 'single' || name == 'closed') {
                                autoCenter = true;
                            }
                        }
                    }

                    // must call destroy before updating options
                    if (recreate) destroyPages();

                    // update options
                    options = $.extend({}, options, newOptions);

                    // make necessary changes
                    if (recreate) createPages();
                    if (size || recreate) updateSize();
                    if (autoCenter || recreate) {
                        updateWrapper();
                        updateAutoCenter();
                    }
                    if (recreate) updatePages();
                    return;
                }

                updateSize();
                updateWrapper();
                updateAutoCenter();
                addControlActions();
            },
            updateSize = function () {

                if (!options.width) {
                    options.width = target.width();
                } else if (isStringPX(options.width)) {
                    options.width = pxStringToNum(options.width);
                } else if (isStringPercent(options.width)) {
                    percentWidthString = options.width;
                    options.width = percentStringToNum(percentWidthString, target.parent().width());
                }

                if (!options.height) {
                    options.height = target.height();
                } else if (isStringPX(options.height)) {
                    options.height = pxStringToNum(options.height);
                } else if (isStringPercent(options.height)) {
                    percentHeightString = options.height;
                    options.height = percentStringToNum(percentHeightString, target.parent().height());
                }

                target.width(options.width);
                target.height(options.height);

                updateCSS();
            },
            updatePercentageSize = function () {
                // recalculate size for percentage values
                if (notUndefinedAndNull(percentWidthString)) {
                    options.width = percentStringToNum(percentWidthString, target.parent().width());
                    target.width(options.width);
                }
                if (notUndefinedAndNull(percentHeightString)) {
                    options.height = percentStringToNum(percentHeightString, target.parent().height());
                    target.height(options.height);
                }
                updateCSS();
            },
            updateCSS = function () {
                $.each(pages, function(){
                    this.pageNode.css(pageSize());
                });
                $.each(shadows(), function(){
                    this.css(pageSize());
                });
            },
            updateWrapper = function(){
                if (!options.autoCenter && !options.single && !options.single) {
                    destroyWrapper();
                } else {
                    createWrapper();
                }
            },
            updateAutoCenter = function(){
                // set width for closed + autoCenter or single
                if (wrapper){
                    wrapper.width(options.width);
                    wrapper.height(options.height);

                    if (options.single){
                        wrapper.width(pageWidth());
                        target.css({marginLeft:pageWidthNegative()});
                    } else if (atBeginning()) {
                        target.css({marginLeft:pageWidthHalfNegative()});
                    } else if (atEnd()) {
                        target.css({marginLeft:pageWidthHalf()});
                    }
                } else {
                    target.css({marginLeft:0});
                }
            },

            addControlActions = function () {
                addKeyboardControlAction();
                addWindowResizeAction();
                addHoverControlAction();
                addHoverClickAction();

                if (options.swipe) {
                    target.on({
                        'swipeleft': next,
                        'swiperight': prev
                    })
                }
            },
            removeControlActions = function () {

                removeKeyboardControlAction();
                removeWindowResizeAction();
                removeHoverControlAction();
                removeHoverClickAction();

                // remove any other namespace actions
                target.off(eventNamespace);
            },
            addKeyboardControlAction = function(){
                $(document).on('keyup' + eventNamespace, function (event) {
                    if (event.keyCode == 37 && options.keyboard) {
                        prev();
                    } else if (event.keyCode == 39 && options.keyboard) {
                        next();
                    }
                });
            },
            removeKeyboardControlAction = function(){
                $(document).off('keyup' + eventNamespace);
            },
            addWindowResizeAction = function() {
                $(window).on('resize' + eventNamespace, function () {
                    if (usingPercentageSize) {
                        updatePercentageSize();
                    }
                });
            },
            removeWindowResizeAction = function() {
                $(window).off('resize' + eventNamespace);
            },
            addHoverControlAction = function() {

                // mouse tracking for page movement
                target.on('mousemove' + eventNamespace,function (e) {
                    diff = e.pageX - target.offset().left;
                    if (options.hovers) {
                        if (options.overlays) {
                            if (diff < pageWidth() && !atBeginning()) {
                                if (hoveringRight) hoverAnimation(true, false);
                                hoverAnimation(false, true);
                            } else if (diff > pageWidth && !atEnd()) {
                                if (hoveringLeft) hoverAnimation(false, false);
                                hoverAnimation(true, true);
                            } else {
                                endHoverAnimations();
                            }
                        } else {
                            if (diff < options.hoverWidth) {
                                hoverAnimation(false, true);
                            } else if (diff > options.width - options.hoverWidth) {
                                hoverAnimation(true, true);
                            } else {
                                endHoverAnimations();
                            }
                        }
                    }
                }).on('mouseleave' + eventNamespace, function(){
                    if (options.hovers) endHoverAnimations();
                });
            },
            removeHoverControlAction = function(){
                target.off('mousemove' + eventNamespace)
                    .off('mouseleave' + eventNamespace);
            },
            addHoverClickAction = function (){

                target.on('click' + eventNamespace, function(e) {
                    diff = e.pageX - target.offset().left;

                    // add overlay or hover click action
                    if (options.overlays || (options.hovers && options.hoverClick)) {
                        if (diff < pageWidth() && !atBeginning()) {
                            if (options.overlays)
                                e.preventDefault();
                            prev();
                        } else if (diff > pageWidth() && !atEnd()) {
                            if (options.overlays)
                                e.preventDefault();
                            next();
                        }
                    }
                });
            },
            removeHoverClickAction = function(){
                target.off('click' + eventNamespace);
            },

        // Page Animations

            next = function () {
                if (!busy && enabled) {
                    goToPage(currentIndex + 2);
                }
            },
            prev = function () {
                if (!busy && enabled) {
                    goToPage(currentIndex - 2);
                }
            },
            goToPage = function (newIndex) {
                if (newIndex != currentIndex && newIndex >= 0 && newIndex < pageTotal && !busy && enabled) {

                    triggerEvent(eventWillChange, options.willchange);

                    busy = true;
                    movingForward = newIndex > currentIndex;
                    diff = movingForward ? newIndex - currentIndex : currentIndex - newIndex;
                    currentIndex = newIndex;

                    // set animation speed, depending if user dragged any distance or not
                    //var speed;
                    //speed = p3drag === true ? options.speed * (p3.width() / pageWidth()) : options.speed;
                    //speed = p0drag === true ? options.speed * (p0.width() / pageWidth()) : options.speed;

                    setupPagesBeforeAnimation(diff);
                    animatePages(diff, options.speed);
                    animateShadows(movingForward, options.speed, 1);
                }
            },
            setupPagesBeforeAnimation = function (diff) {
                // initialize visible pages, if jumping forward or backward in the book
                if (movingForward && diff > 2) {
                    p3.hide(); p4.hide();
                    p3 = pages[currentIndex].pageNode.css(css.pageInner).show();
                    p4 = pages[currentIndex+1].pageNode.css(css.pageOuter).show();
                } else if (!movingForward && diff > 2) {
                    pN.hide(); p0.hide();
                    pN = pages[currentIndex].pageNode.css(css.pageOuter).show();
                    p0 = pages[currentIndex+1].pageNode.css(css.pageInner).show();
                }
            },
            animatePages = function(diff, speed) {

                triggerEvent(eventStartChange, options.startchange);

                // auto center
                if (!options.single && wrapper){
                    if ((movingForward && currentIndex - diff == 0) || (!movingForward && currentIndex + diff >= pageTotal - 2)) {
                        target.transition({marginLeft:0}, speed, options.easing);
                    } else if (movingForward && atEnd()) {
                        target.transition({marginLeft:pageWidthHalf()}, speed, options.easing);
                    } else if (!movingForward && atBeginning()) {
                        target.transition({marginLeft:pageWidthHalfNegative()}, speed, options.easing);
                    }
                }

                var a1 = movingForward ? p2 : p1,
                    a2 = movingForward ? p3 : p0,
                    a3 = movingForward ? p4 : pN;

                if (a3) a3.css({visibility:'visible'});
                a1.transition({rotateY: movingForward ? nDeg(90) : deg(90) }, speed/2, options.easeIn, function(){
                    a1.transition({visibility:'hidden'}, 0);
                    a2.transition({visibility:'visible'}, 0)
                        .transition({rotateY:deg(0)}, speed/2, options.easeOut, updateAfter);
                });
                a2.transition({rotateY: movingForward ? deg(90) : nDeg(90)}, speed/2, options.easeIn);

                // todo: handle manual drag
            },
            updateAfter = function () {
                updatePages();
                busy = false;
                triggerEvent(eventDidChange, options.didchange);
            },
            animateShadows = function (inc, speed, opacity) {

                if (options.shadows) {

                    addShadows(inc);

                    var s1 = inc ? shadowLeft1 : shadowRight1,
                        s2 = inc ? shadowLeft2 : shadowRight2,
                        s3 = inc ? shadowRight1 : shadowLeft1,
                        s4 = inc ? shadowRight2 : shadowLeft2;

                    s1.css({ opacity: opacity });
                    s4.css({ opacity: opacity });
                    s4.stop().transition({ opacity: 0 }, speed, options.easing);
                    s3.stop().transition({ opacity: opacity }, speed/2, options.easeIn, function(){
                        s1.stop().transition({ opacity: 0 }, speed/2, options.easeOut);
                    });
                    s2.stop().transition({ opacity: opacity }, speed, options.easing, function () {
                        if (opacity == 0) removeShadows();
                    });
                }
            },

        // Hover Animations
            hoverAnimation = function (inc, start) {
                if (enabled && !busy && options.hovers) {
                    var h1 = inc ? p4 : pN,
                        h2 = inc ? p2 : p1;
                    if (start){
                        if (inc && (hoveringRight || !canGoForward()) || !inc && (hoveringLeft || !canGoBack())){
                            return;
                        }
                        if (inc) {
                            hoveringRight = true;
                        } else {
                            hoveringLeft = true;
                        }
                        h1.css({visibility:'visible'});
                        h2.stop().transition({rotateY: inc ? nDeg(10) : deg(10)}, options.hoverSpeed, options.easing);
                        animateShadows(inc, options.hoverSpeed, 0.10);
                    } else {
                        if (inc && (!hoveringRight || !canGoForward()) || !inc && (!hoveringLeft || !canGoBack())){
                            return;
                        }
                        h1.css({visibility:'hidden'});
                        h2.stop().transition({rotateY: deg(0)}, options.hoverSpeed, options.easing, function(){
                            if (inc) {
                                hoveringRight = false;
                            } else {
                                hoveringLeft = false;
                            }
                        });
                        animateShadows(inc, options.hoverSpeed, 0);
                    }
                }
            },
            endHoverAnimations = function () {
                hoverAnimation(false, false);
                hoverAnimation(true, false);
            },

        // Dynamic Page Add + Remove

            pageIndexStringToNum = function(index){
                return index == "start" ? 0 : index == "end" ? originalPageTotal : index;
            },
            addPage = function (index, html) {
                if (!validatePageIndex(index)) return;
                if (!notUndefinedAndNull(html) || html == '') return;
                index = pageIndexStringToNum(index);

                // remove page structure, revert to original order
                destroyPages();
                removeControlActions();

                // add new page
                if (index == originalPageTotal) {
                    target.children(':eq(' + (index - 1) + ')').after(html);
                } else {
                    target.children(':eq(' + index + ')').before(html);
                }

                triggerEvent(eventAdd, options.add, index, target.children(':eq(' + index + ')')[0]);

                originalPageTotal = target.children().length;

                // recall initialize functions
                createPages();
                updateOptions();
                updatePages();
            },
            removePage = function (index) {
                if (!validatePageIndex(index)) return;
                index = pageIndexStringToNum(index);

                // stop if removing last remaining page
                if (pagesNotTransparent().length == 2)
                    return;

                // remove page structure, revert to original order
                destroyPages();
                removeControlActions();

                // remove page
                var removedPage = target.children(':eq(' + (index == originalPageTotal ? (index - 1) : index) + ')').remove();
                triggerEvent(eventRemove, options.remove, index, removedPage[0]);
                removedPage = null;

                originalPageTotal = target.children().length;

                // recall initialize functions
                createPages();

                // update currentIndex
                if (!isLTR()) index = Math.abs(index - pageTotal) - 2;
                if (index >= currentIndex) {
                    if (index > 0 && (index % 2) != 0) {
                        currentIndex = currentIndex - 1;
                    }
                }
                if (currentIndex < 0) {
                    currentIndex = 0;
                }
                if (currentIndex > pageTotal - 2) {
                    currentIndex = pageTotal - 2;
                }

                updateOptions();
                updatePages();
            };

        // Public

        this.info = getInfo;
        this.init = init;
        this.enable = enable;
        this.disable = disable;
        this.destroy = destroy;
        this.next = next;
        this.prev = prev;
        this.gotopage = function (index) {
            if (!notUndefinedAndNull(index)) {
                $.error('jquery.booklet:gotopage: index must not be undefined or null');
                return;
            }
            if (isNumber(index) && index < 0 || index >= pageTotal){
                $.error('jquery.booklet:gotopage: index is out of bounds');
                return;
            }
            if (isString(index)) {
                index = index == "start" ? 0 : index == "end" ? pageTotal - 2 : parseInt(index);
                if (isNaN(index)){
                    $.error('jquery.booklet:gotopage: index parseInt failed');
                    return;
                }
            }
            // adjust for odd page
            if (index % 2 != 0) {
                index -= 1;
            }
            // adjust for booklet direction
            if (!isLTR()) {
                index = Math.abs(index - pageTotal) - 2;
            }
            goToPage(index);
        };
        this.add = addPage;
        this.remove = removePage;
        this.option = function (name, value) {
            if (isString(name)) {
                if (!notUndefinedAndNull(options[name]))
                    $.error('jquery.booklet:option: option "' + name + '" does not exist');
                if (notUndefinedAndNull(value)) {
                    var option = {};
                    option[name] = value;
                    updateOptions(option);
                    return value;
                }
                // if no value sent in, get the current option value
                return options[name];
            }
            // if sending in an object, update options
            if (isObject(name)) {
                updateOptions(name);
            }
            return $.extend({}, options);
        };

        // call initialize function
        this.init();
    }
    Booklet.prototype = {
        constructor: Booklet
    };

})(jQuery);