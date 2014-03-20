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

    // Private Constants

    var classes = {
            booklet: 'booklet',
            page: {
                default: 'b-page',
                blank: 'b-page b-page-blank',
                cover: 'b-page b-page-cover',
                transparent: 'b-page b-page-transparent'
            },
            shadow: 'b-shadow',
            wrapper: 'b-wrapper'
        },
        css = {
            page: {visibility:'hidden', zIndex:10},
            pageOuter: {zIndex: 10},
            pageInner: {zIndex: 30},
            pageVisible: {visibility: 'visible', zIndex: 20}
        },
        direction = {
            leftToRight: 'LTR',
            rightToLeft: 'RTL'
        },
        events = {
            create:      'bookletcreate',      // called when booklet has been created
            willchange:  'bookletwillchange',  // called when booklet will changes pages, before the DOM or CSS is updated
            startchange: 'bookletstartchange', // called when booklet starts to change pages
            didchange:   'bookletdidchange',   // called when booklet has finished changing pages
            add:         'bookletadd',         // called when booklet has added a page
            remove:      'bookletremove'       // called when booklet has removed a page
        },
        namespace = '.booklet'; // namespace for all internal events

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
            booklet.init();

            // preserve chaining on main function
            return this;
        });
    };

    // Plugin Default Options
    
    $.fn.booklet.defaults = {
        width:                600,                             // container width
        height:               400,                             // container height
        speed:                500,                             // speed of the transition between pages
        direction:            'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
        startingIndex:         0,                              // index of the first page to be displayed
        easing:               'easeInOutQuad',                 // easing method for complete transition
        easeIn:               'easeInQuad',                    // easing method for first half of transition
        easeOut:              'easeOutQuad',                   // easing method for second half of transition

        single:               false,
        closed:               false,                           // start with the book "closed", will add empty pages to beginning and end of book
        autoCenter:           false,                           // used with "closed", makes book position in center of container when closed

        manual:               true,                            // enables manual page turning, requires jQuery UI to function
        hovers:               true,                            // enables preview page-turn hover animation, shows a small preview of previous or next page on hover
        hoverWidth:           50,                              // default width for page-turn hover preview
        hoverSpeed:           500,                             // default speed for page-turn hover preview
        hoverThreshold:       0.25,                            // default percentage used for manual page dragging, sets the percentage amount a drag must be before moving next or prev
        hoverClick:           true,                            // enables hovered areas to be clicked when using manual page turning
        overlays:             false,                           // enables navigation using a page sized overlay, when enabled links inside the content will not be clickable        arrows:               false,                           // adds arrow overlays over the book edges
        keyboard:             true,                            // enables navigation with arrow keys (left: previous, right: next)
        shadows:              true,                            // display shadows on page animations

        // callbacks
        create:               null,                            // called when booklet has been created
        willchange:           null,                            // called when booklet will changes pages, before the DOM or CSS is updated
        startchange:          null,                            // called when booklet starts to change pages
        didchange:            null,                            // called when booklet has finished changing pages
        add:                  null,                            // called when booklet has added a page
        remove:               null                             // called when booklet has removed a page
    };

    // Page

    function Page(contentNode, index){
        this.index = index;
        this.contentNode = contentNode;
        this.isTransparent = this.contentNode.hasClass(classes.page.transparent);
        this.isBlank = this.contentNode.hasClass(classes.page.blank);
        this.pageNode = this.createPageNode();
    }
    Page.prototype = {
        constructor: Page,
        createPageNode: function () {
            if (this.isBlank || this.isTransparent) {
                return this.contentNode;
            } else {
                return this.contentNode.wrap(template(classes.page.default)).parent();
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
                
        var that = this,
            target = inTarget,
            options = $.extend({}, $.fn.booklet.defaults, inOptions),
            wrapper, pages = [], pN, p0, p1, p2, p3, p4,
            created = false, busy = false, hoveringRight = false, hoveringLeft = false, enabled = false, movingForward = false,
            diff, originalPageTotal, pageTotal, currentIndex,
            p3drag, p0drag,
            percentWidthString, percentHeightString,
            shadowLeft1, shadowRight1, shadowLeft2, shadowRight2,

        // Helpers

            triggerEvent = function(event, callback, index, eventPages){
                index = index || currentIndex;
                eventPages = eventPages || [pages[currentIndex], pages[currentIndex + 1]];

                if (callback) {
                    target.off(event + namespace).on(event + namespace, callback);
                }
                target.trigger(event, {
                    booklet: that,
                    currentIndex: currentIndex,
                    eventIndex: index,
                    options: $.extend({}, options),
                    pages: eventPages,
                    pageTotal: pageTotal
                });
            },
            isLTR = function(){
                return options.direction == direction.leftToRight;
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
                target.addClass(classes.booklet);
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

                triggerEvent(events.create, options.create);
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
                target.removeClass(classes.booklet).css({width:'',height:''});
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
                                $(this).before(template(classes.page.blank));
                            } else {
                                $(this).after(template(classes.page.blank));
                            }
                        }
                    });
                }

                // fix for odd number of pages
                if ((target.children().length % 2) != 0) {
                    target.children().last().after(template(classes.page.blank));
                }

                // if closed book, add empty pages to start and end
                if (options.closed) {
                    target.prepend(template(classes.page.transparent));
                    target.append(template(classes.page.transparent));
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
                shadowLeft1 = $(template(classes.shadow));
                shadowLeft2 = $(template(classes.shadow));
                shadowRight1= $(template(classes.shadow));
                shadowRight2 = $(template(classes.shadow));
            },
            addShadows = function (inc) {
                if ((inc && shadowLeft1.parent() != p3) || (!inc && shadowLeft1.parent() != p1)) {
                    shadowLeft1.css({opacity:0}).appendTo(inc ? p3 : p1);
                }
                if ((inc && shadowRight1.parent() != p2) || (!inc && shadowRight1.parent() != p0)) {
                    shadowRight1.css({opacity:0}).appendTo(inc ? p2: p0);
                }
                if ((inc && shadowLeft2.parent() != p1) || (!inc && shadowLeft2.parent() != pN)) {
                    shadowLeft2.css({opacity:0}).appendTo(inc ? p1 : pN);
                }
                if ((inc && shadowRight2.parent() != p4) || (!inc && shadowRight2.parent() != p2)) {
                    shadowRight2.css({opacity:0}).appendTo(inc ? p4: p2);
                }
            },
            removeShadows = function () {
                $.each(shadows(), function(){ this.remove() });
            },

        // Wrapper

            createWrapper = function(){
                if (target.parent().hasClass(classes.wrapper)) {
                    wrapper = target.parent();
                } else {
                    wrapper = target.wrap(template(classes.wrapper)).parent();
                }
            },
            destroyWrapper = function(){
                if (target.parent().hasClass(classes.wrapper)){
                    target.unwrap();
                    wrapper = null;
                }
            },

        // Options

            updateOptions = function (newOptions) {

                var didUpdate = false;

                // update options if newOptions have been passed in
                if (notUndefinedAndNull(newOptions)) {

                    // todo: don't fully re-create for all options

                    // remove page structure, revert to original order
                    destroyPages();

                    options = $.extend({}, options, newOptions);
                    didUpdate = true;

                    createPages();
                }

                updateSize();

                // autoCenter
                if (!options.autoCenter && !options.single && !options.single) {
                    destroyWrapper();
                } else {
                    createWrapper();
                    updateAutoCenter();
                }

                removeControlActions();
                addControlActions();

                // if options were updated force pages and controls to update
                if (didUpdate) {
                    updatePages();
                }
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
            updateAutoCenter = function(){
                // set width for closed + autoCenter or single
                if (options.closed && options.autoCenter || options.single) {
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
                }
            },
            addControlActions = function () {

                $(document).on('keyup' + namespace, function (event) {
                    if (event.keyCode == 37 && options.keyboard) {
                        prev();
                    } else if (event.keyCode == 39 && options.keyboard) {
                        next();
                    }
                });

                $(window).on('resize' + namespace, function () {
                    if (usingPercentageSize) {
                        updatePercentageSize();
                    }
                });

                // add page hover animations
                if (options.hovers) {
                    // mouse tracking for page movement
                    target.on('mousemove' + namespace,function (e) {
                        diff = e.pageX - target.offset().left;
                        if (options.overlays) {
                            if (diff < pageWidth() && !atBeginning()) {
                                if (hoveringRight) endHoverAnimation(true);
                                startHoverAnimation(false);
                            } else if (diff > pageWidth && !atEnd()) {
                                if (hoveringLeft) endHoverAnimation(false);
                                startHoverAnimation(true);
                            } else {
                                endHoverAnimations();
                            }
                        } else {
                            if (diff < options.hoverWidth) {
                                startHoverAnimation(false);
                            } else if (diff > options.width - options.hoverWidth) {
                                startHoverAnimation(true);
                            } else {
                                endHoverAnimations();
                            }
                        }
                    }).on('mouseleave' + namespace, function () {
                        endHoverAnimations();
                    });
                }

                // add overlay or hover click action
                if (options.overlays || options.hovers) {
                    // mouse tracking for page movement
                    target.on('click' + namespace, function(e) {
                        diff = e.pageX - target.offset().left;
                        if (diff < pageWidth() && !atBeginning()) {
                            if (options.overlays)
                                e.preventDefault();
                            prev();
                        } else if (diff > pageWidth() && !atEnd()) {
                            if (options.overlays)
                                e.preventDefault();
                            next();
                        }
                    });
                }
            },
            removeControlActions = function () {

                // keyboard
                $(document).off('keyup' + namespace);

                // window resize
                $(window).off('resize' + namespace);

                // remove mouse tracking for page movement and hover clicks
                target.off(namespace);

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

                    triggerEvent(events.willchange, options.willchange);

                    busy = true;
                    movingForward = newIndex > currentIndex;
                    diff = movingForward ? newIndex - currentIndex : currentIndex - newIndex;
                    currentIndex = newIndex;

                    // set animation speed, depending if user dragged any distance or not
                    //var speed;
                    //speed = p3drag === true ? options.speed * (p3.width() / pageWidth()) : options.speed;
                    //speed = p0drag === true ? options.speed * (p0.width() / pageWidth()) : options.speed;

                    setupPagesBeforeAnimation(diff, movingForward);
                    animatePages(diff, movingForward, options.speed);
                    animateShadows(movingForward, options.speed, 1);
                }
            },
            setupPagesBeforeAnimation = function (diff, inc) {
                // initialize visible pages, if jumping forward or backward in the book
                if (inc && diff > 2) {
                    p3.hide(); p4.hide();
                    p3 = pages[currentIndex].pageNode.css(css.pageInner).show();
                    p4 = pages[currentIndex+1].pageNode.css(css.pageOuter).show();
                } else if (!inc && diff > 2) {
                    pN.hide(); p0.hide();
                    pN = pages[currentIndex].pageNode.css(css.pageOuter).show();
                    p0 = pages[currentIndex+1].pageNode.css(css.pageInner).show();
                }
            },
            animatePages = function(diff, inc, speed) {

                triggerEvent(events.startchange, options.startchange);

                // auto center
                if (!options.single && wrapper){
                    if ((inc && currentIndex - diff == 0) || (!inc && currentIndex + diff >= pageTotal - 2)) {
                        target.transition({marginLeft:0}, speed, options.easing);
                    } else if (inc && atEnd()) {
                        target.transition({marginLeft:pageWidthHalf()}, speed, options.easing);
                    } else if (!inc && atBeginning()) {
                        target.transition({marginLeft:pageWidthHalfNegative()}, speed, options.easing);
                    }
                }

                var a1 = inc ? p2 : p1,
                    a2 = inc ? p3 : p0,
                    a3 = inc ? p4 : pN;

                if (a3) a3.css({visibility:'visible'});
                a1.transition({rotateY: inc ? nDeg(90) : deg(90) }, speed/2, options.easeIn, function(){
                    a1.transition({visibility:'hidden'}, 0);
                    a2.transition({visibility:'visible'}, 0)
                        .transition({rotateY:deg(0)}, speed/2, options.easeOut, updateAfter);
                });
                a2.transition({rotateY: inc ? deg(90) : nDeg(90)}, speed/2, options.easeIn);

                // todo: handle manual drag
            },
            updateAfter = function () {
                updatePages();
                busy = false;
                triggerEvent(events.didchange, options.didchange);
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

            startHoverAnimation = function (inc) {
                if (!enabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!busy && !hoveringRight && !p3drag && canGoForward()) {
                            p4.css({visibility:'visible'});
                            p2.stop().transition({rotateY:'-10deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0.10);
                            hoveringRight = true;
                        }
                    } else {
                        if (!busy && !hoveringLeft && !p0drag && canGoBack()) {
                            pN.css({visibility:'visible'});
                            p1.stop().transition({rotateY:'10deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0.10);
                            hoveringLeft = true;
                        }
                    }
                }
            },
            endHoverAnimation = function (inc) {
                if (enabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!busy && hoveringRight && !p3drag && canGoForward()) {
                            p4.css({visibility:'hidden'});
                            p2.stop().transition({rotateY:'0deg'}, options.hoverSpeed, options.easing, function(){
                                hoveringRight = false;
                            });
                            animateShadows(inc, options.hoverSpeed, 0);
                        }
                    } else {
                        if (!busy && hoveringLeft && !p0drag && canGoBack()) {
                            pN.css({visibility:'hidden'});
                            p1.stop().transition({rotateY:'0deg'}, options.hoverSpeed, options.easing, function(){
                                hoveringLeft = false;
                            });
                            animateShadows(inc, options.hoverSpeed, 0);
                        }
                    }
                }
            },
            endHoverAnimations = function () {
                endHoverAnimation(false);
                endHoverAnimation(true);
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

                triggerEvent(events.add, options.add, index, target.children(':eq(' + index + ')')[0]);

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
                if (target.children(classes.page).not(classes.page.transparent).length == 2) return;

                // remove page structure, revert to original order
                destroyPages();
                removeControlActions();

                // remove page
                var removedPage = target.children(':eq(' + (index == originalPageTotal ? (index - 1) : index) + ')').remove();
                triggerEvent(events.remove, options.remove, index, removedPage[0]);
                removedPage = null;

                // update currentIndex
                if (index >= currentIndex) {
                    if (index > 0 && (index % 2) != 0) {
                        currentIndex -= 2;
                    }
                    if (currentIndex < 0) {
                        currentIndex = 0;
                    }
                }

                originalPageTotal = target.children().length;

                // recall initialize functions
                createPages();
                updateOptions();
                updatePages();
            };

        // Public

        return {
            init: init,
            enable: enable,
            disable: disable,
            destroy: destroy,
            next: next,
            prev: prev,
            gotopage: function (index) {
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
            },
            add: addPage,
            remove: removePage,
            option: function (name, value) {
                if (isString(name)) {
                    if (!notUndefinedAndNull(options[name]))
                        $.error('jquery.booklet:option: option "' + name + '" does not exist');
                    if (notUndefinedAndNull(value)) {
                        // if value is sent in, set the option value and update options
                        options[name] = value;
                        updateOptions();
                        // todo: only update specific option
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
            }
        }
    }
})(jQuery);