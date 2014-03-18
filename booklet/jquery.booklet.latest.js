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
    
    var templates = {
        page : {
            blank: '<div class="b-page b-page-blank"></div>', // page with no content
            transparent: '<div class="b-page b-page-transparent"></div>', // transparent page used with closed books
            cover: '<div class="b-page b-page-cover"></div>', // cover page
            default: '<div class="b-page"></div>' // default page
        },
        shadow : {
            left: '<div class="b-shadow-left"></div>', // shadow for left handed pages
            right: '<div class="b-shadow-right"></div>' // shadow for right handed pages
        },
        pageNumber: '<div class="b-counter"></div>',
        wrapper: '<div class="b-wrapper"></div>'
    },
    direction = {
        leftToRight: "LTR",
        rightToLeft: "RTL"
    },
    event = {
        create:      'bookletcreate', // called when booklet has been created
        willchange:  'bookletwillchange', // called when booklet will change pages
        startchange: 'bookletstartchange',  // called when booklet starts to change pages
        didchange:   'bookletdidchange', // called when booklet has finished changing pages
        add:         'bookletadd',    // called when booklet has added a page
        remove:      'bookletremove'  // called when booklet has removed a page
    },
    namespace = '.booklet'; // namespace for all internal events

    // Main Plugin Method

    $.fn.booklet = function (optionsOrMethod, param1, param2) {

        var booklet, params, output, result;

        // call a method by name
        if (typeof optionsOrMethod === 'string') {

            result = [];

            // add optional parameters
            params = [];
            if (typeof param1 !== 'undefined') {
                params.push(param1);
            }
            if (typeof param2 !== 'undefined') {
                params.push(param2);
            }

            // loop each booklet, adding results to array
            $(this).each(function () {

                // get the Booklet
                booklet = $(this).data('booklet');

                // validate
                if (!booklet)
                    $.error('jQuery.booklet has not been initialized. Method "' + optionsOrMethod + '" cannot be called.');
                if (!booklet[optionsOrMethod])
                    $.error('Method "' + optionsOrMethod + '" does not exist on jQuery.booklet.');

                // call the method
                output = booklet[optionsOrMethod].apply(booklet, params);
                if (typeof output !== 'undefined' || output) {
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

    // Default Options
    
    $.fn.booklet.defaults = {
        width:                600,                             // container width
        height:               400,                             // container height
        speed:                500,                            // speed of the transition between pages
        direction:            'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
        startingIndex:         0,                               // index of the first page to be displayed
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
        willchange:           null,                            // called when booklet starts to change pages
        startchange:          null,
        didchange:            null,                            // called when booklet has finished changing pages
        add:                  null,                            // called when booklet has added a page
        remove:               null                             // called when booklet has removed a page
    };

    // Page

    function Page(contentNode, index){
        this.index = index;
        this.contentNode = contentNode;
        this.isTransparent = this.contentNode.hasClass('b-page-transparent');
        this.isBlank = this.contentNode.hasClass('b-page-blank');
        this.pageNode = this.createPageNode();
    }
    Page.prototype = {
        constructor: Page,
        createPageNode: function () {
            if (this.isBlank || this.isTransparent) {
                return this.contentNode;
            } else {
                return this.contentNode.wrap(templates.page.default).parent();
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
            isInit = false, isBusy = false, isHoveringRight = false, isHoveringLeft = false, isDisabled = false, movingForward = false,

            // default css
            css = {
                page: {visibility:'hidden', zIndex:10},
                pageOuter: {zIndex: 10},
                pageInner: {zIndex: 30},
                pageVisible: {visibility: 'visible', zIndex: 20}
            },
            wrapper, pages = [], pN, p0, p1, p2, p3, p4,

        // control vars
            
            diff, originalPageTotal, pageTotal, currentIndex,
            p3drag, p0drag,
            percentWidthString, percentHeightString,
            shadowLeft1, shadowRight1, shadowLeft2, shadowRight2,

        // Main

            init = function () {

                // setup target DOM object
                target.addClass('booklet');

                // store data for api calls
                target.data('booklet', this);

                // save original number of pages
                originalPageTotal = target.children().length;
                currentIndex = 0;

                createShadows();
                createPages();
                updateOptions();
                updatePages();

                isInit = true;
                isDisabled = false;

                if (options.create) {
                    target.off(event.create + namespace).on(event.create + namespace, options.create);
                }
                target.trigger(event.create, {
                    options: $.extend({}, options),
                    index: currentIndex,
                    pages: [pages[currentIndex], pages[currentIndex + 1]]
                });

            },
            enable = function () {
                isDisabled = false;
            },
            disable = function () {
                isDisabled = true;
            },
            destroy = function () {

                // remove actions
                removeControlActions();

                // remove markup
                destroyPages();
                destroyWrapper();

                // clear class from target DOM object
                target.removeClass('booklet');

                // clear out booklet from data object
                target.removeData('booklet');

                isInit = false;
            },

        // Helpers

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

            isStringPX = function(input){
                return typeof input == 'string' && input.indexOf("px") != -1;
            },
            pxStringToNum = function(string){
                return string.replace('px', '');
            },
            isStringPercent = function(input){
                return typeof input == 'string' && input.indexOf("%") != -1
            },
            percentStringToNum = function(string, parentSize){
                return (string.replace('%', '') / 100) * parseFloat(parentSize);
            },
            usingPercentageSize = function(){
                return typeof percentWidthString !== 'undefined' && percentWidthString != null || typeof percentHeightString !== 'undefined' && percentHeightString != null;
            },

            pageWidth = function(){
                return options.width / 2;
            },
            pageWidthHalf = function(){
                return  pageWidth() / 2;
            },
            pageWidthNegative = function(){
                return '-' + pageWidth() + 'px';
            },
            pageWidthHalfNegative = function(){
                return '-' + pageWidthHalf() + 'px';
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

        // Pages

            createPages = function () {
                pages = [];

                // single layout, add spacer pages
                if (options.single) {
                    target.children().each(function (i) {
                        if (!options.closed || i != 0){
                            if (isLTR()){
                                $(this).before(templates.page.blank);
                            } else {
                                $(this).after(templates.page.blank);
                            }
                        }
                    });
                }

                // fix for odd number of pages
                if ((target.children().length % 2) != 0) {
                    target.children().last().after(templates.page.blank);
                }

                // if closed book, add empty pages to start and end
                if (options.closed) {
                    target.prepend(templates.page.transparent);
                    target.append(templates.page.transparent);
                }


                // set total page count
                pageTotal = target.children().length;

                // reverse content order
                if (!isLTR()) {
                    reversePageOrder();
                }

                // set currentIndex
                if (!isInit) {
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
                $.each(pages, function(){
                    this.destroy();
                });
                pages = [];

                removeShadows();

                if (!isLTR()) {
                    reversePageOrder();
                }
            },


        // Shadows

            createShadows = function(){
                shadowLeft1 = $(templates.shadow.left);
                shadowLeft2 = $(templates.shadow.left);
                shadowRight1= $(templates.shadow.right);
                shadowRight2 = $(templates.shadow.right);
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

        // Options

            updateOptions = function (newOptions) {

                var didUpdate = false;

                // update options if newOptions have been passed in
                if (newOptions != null && typeof newOptions != "undefined") {

                    // todo: don't fully re-create for all options

                    // remove page structure, revert to original order
                    destroyPages();

                    options = $.extend({}, options, newOptions);
                    didUpdate = true;

                    createPages();
                }

                updateSizes();

                // autoCenter
                if (!options.autoCenter && !options.single) {
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

            updateSizes = function () {
                // set width + height
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
            updateAutoCenter = function(){
                // set width for closed + autoCenter
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
            createWrapper = function(){
                if (options.closed && options.autoCenter || options.single) {
                    if (target.parent().hasClass('b-wrapper')) {
                        wrapper = target.parent();
                    } else {
                        wrapper = target.wrap(templates.wrapper).parent();
                    }
                }
            },
            destroyWrapper = function(){
                if (target.parent().hasClass('b-wrapper')){
                    target.unwrap();
                    wrapper = null;
                }
            },
            updatePercentageSize = function () {
                if (!isDisabled) {
                    // recalculate size for percentage values
                    if (typeof percentWidthString !== 'undefined' && percentWidthString != null) {
                        options.width = percentStringToNum(percentWidthString, target.parent().width());
                        target.width(options.width);
                    }
                    if (typeof percentHeightString !== 'undefined' && percentHeightString != null) {
                        options.height = percentStringToNum(percentHeightString, target.parent().height());
                        target.height(options.height);
                    }
                    updateCSS();
                }
            },
            updateCSS = function () {
                $.each(pages, function(){
                    this.pageNode.css(pageSize());
                });
                $.each(shadows(), function(){
                    this.css(pageSize());
                });
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
                                if (isHoveringRight) endHoverAnimation(true);
                                startHoverAnimation(false);
                            } else if (diff > pageWidth && !atEnd()) {
                                if (isHoveringLeft) endHoverAnimation(false);
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

                // manual
            },

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // DYNAMIC FUNCTIONS
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            validatePageIndex = function(index){
                if (typeof index === "undefined" || index == null)
                    return false;
                if (typeof index === "number" && (index < 0 || index > originalPageTotal))
                    return false;
                return true;
            },
            addPage = function (index, html) {
                if (!validatePageIndex(index)) return;
                if (typeof html === "undefined" || html == '' || html == null) return;
                index = index == "start" ? 0 : index == "end" ? originalPageTotal : index;

                // remove page structure, revert to original order
                destroyPages();
                removeControlActions();

                // add new page
                if (index == originalPageTotal) {
                    //end of book
                    target.children(':eq(' + (index - 1) + ')').after(html);
                } else {
                    target.children(':eq(' + index + ')').before(html);
                }

                originalPageTotal = target.children().length;

                // callback for adding page, returns options, index and the page node
                if (options.add) {
                    target.off(event.add + namespace).on(event.add + namespace, options.add);
                }
                target.trigger(event.add, {
                    options: $.extend({}, options),
                    index: index,
                    page: target.children(':eq(' + index + ')')[0]
                });

                // recall initialize functions
                createPages();
                updateOptions();
                updatePages();
            },
            removePage = function (index) {
                if (!validatePageIndex(index)) return;
                index = index == "start" ? 0 : index == "end" ? originalPageTotal : index;

                // stop if removing last remaining page
                if (target.children('.b-page').length == 2 && target.find('.b-page-blank').length > 0) {
                    return;
                }

                // remove page structure, revert to original order
                destroyPages();
                removeControlActions();

                // update currentIndex
                if (index >= currentIndex) {
                    if (index > 0 && (index % 2) != 0) {
                        currentIndex -= 2;
                    }
                    if (currentIndex < 0) {
                        currentIndex = 0;
                    }
                }

                var removedPage;

                // remove page
                if (index == originalPageTotal) {
                    // end of book
                    removedPage = target.children(':eq(' + (index - 1) + ')').remove();
                } else {
                    removedPage = target.children(':eq(' + index + ')').remove();
                }

                originalPageTotal = target.children().length;

                // callback for removing page, returns options, index and the page node
                if (options.remove) {
                    target.off(event.remove + namespace).on(event.remove + namespace, options.remove);
                }
                target.trigger(event.remove, {
                    options: $.extend({}, options),
                    index: index,
                    page: removedPage[0]
                });

                removedPage = null;

                // recall initialize functions
                createPages();
                updateOptions();
                updatePages();
            },

        // Hover Animations

            startHoverAnimation = function (inc) {
                if (!isDisabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!isBusy && !isHoveringRight && !p3drag && canGoForward()) {
                            p4.css({visibility:'visible'});
                            p2.stop().transition({rotateY:'-10deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0.10);
                            isHoveringRight = true;
                        }
                    } else {
                        if (!isBusy && !isHoveringLeft && !p0drag && canGoBack()) {
                            pN.css({visibility:'visible'});
                            p1.stop().transition({rotateY:'10deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0.10);
                            isHoveringLeft = true;
                        }
                    }
                }
            },
            endHoverAnimation = function (inc) {
                if (!isDisabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!isBusy && isHoveringRight && !p3drag && canGoForward()) {
                            p4.css({visibility:'hidden'});
                            p2.stop().transition({rotateY:'0deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0);
                            isHoveringRight = false;
                        }
                    } else {
                        if (!isBusy && isHoveringLeft && !p0drag && canGoBack()) {
                            pN.css({visibility:'hidden'});
                            p1.stop().transition({rotateY:'0deg'}, options.hoverSpeed, options.easing);
                            animateShadows(inc, options.hoverSpeed, 0);
                            isHoveringLeft = false;
                        }
                    }
                }
            },
            endHoverAnimations = function () {
                endHoverAnimation(false);
                endHoverAnimation(true);
            },

        // Page Animations

            next = function () {
                if (!isBusy && !isDisabled) {
                    goToPage(currentIndex + 2);
                }
            },
            prev = function () {
                if (!isBusy && !isDisabled) {
                    goToPage(currentIndex - 2);
                }
            },
            goToPage = function (newIndex) {
                var speed = options.speed;
                if (newIndex < pageTotal && newIndex >= 0 && !isBusy && !isDisabled) {
                    if (newIndex > currentIndex) {
                        isBusy = true;
                        diff = newIndex - currentIndex;
                        currentIndex = newIndex;
                        movingForward = true;
                        // set animation speed, depending if user dragged any distance or not
                        //speed = p3drag === true ? options.speed * (p3.width() / pageWidth()) : speedHalf();
                    } else if (newIndex < currentIndex) {
                        isBusy = true;
                        diff = currentIndex - newIndex;
                        currentIndex = newIndex;
                        movingForward = false;
                        // set animation speed, depending if user dragged any distance or not
                        //speed = p0drag === true ? options.speed * (p0.width() / pageWidth()) : speedHalf();
                    }

                    // callback when starting booklet animation
                    if (options.willchange) {
                        target.off(event.willchange + namespace).on(event.willchange + namespace, options.willchange);
                    }
                    target.trigger(event.willchange, {
                        options: $.extend({}, options),
                        index: newIndex,
                        pages: [pages[newIndex].contentNode, pages[newIndex + 1].contentNode]
                    });

                    setupPagesBeforeAnimation(diff, movingForward);
                    animatePages(diff, movingForward, speed);
                    animateShadows(movingForward, speed, 1);
                }
            },
            setupPagesBeforeAnimation = function (diff, inc) {
                // initialize next 2 visible pages, if jumping forward or backward in the book
                if (inc && diff > 2) {
                    p3.hide(); p4.hide();
                    p3 = pages[currentIndex].pageNode.css(css.pageInner).show();
                    p4 = pages[currentIndex + 1].pageNode.css(css.pageOuter).show();
                } else if (!inc && diff > 2) {
                    pN.hide(); p0.hide();
                    pN = pages[currentIndex].pageNode.css(css.pageOuter).show();
                    p0 = pages[currentIndex + 1].pageNode.css(css.pageInner).show();
                }
            },
            animatePages = function(diff, inc, speed) {

                // callback when starting booklet animation
                if (options.startchange) {
                    target.off(event.startchange + namespace).on(event.startchange + namespace, options.startchange);
                }
                target.trigger(event.startchange, {
                    options: $.extend({}, options),
                    index: currentIndex,
                    pages: [pages[currentIndex].contentNode, pages[currentIndex + 1].contentNode]
                });

                if (inc) {
                    p4.css({visibility:'visible'});

                    if (!options.single){
                        if (wrapper && currentIndex - diff == 0) {
                            target.transition({marginLeft:0}, speed, options.easing);
                        } else if (wrapper && atEnd()) {
                            target.transition({marginLeft:pageWidthHalf()}, speed, options.easing);
                        }
                    }

                    p2.transition({rotateY:'-90deg'}, speed/2, options.easeIn, function(){
                        p2.transition({visibility:'hidden'}, 0);
                        p3.transition({visibility:'visible'}, 0)
                          .transition({rotateY:'0deg'}, speed/2, options.easeOut, updateAfter);
                    });
                    p3.transition({rotateY:'90deg'}, speed/2, options.easeIn);

                    //todo: handle manual drag

                } else {
                    pN.css({visibility:'visible'});

                    if (!options.single){
                        if (wrapper && atBeginning()) {
                            target.transition({marginLeft:pageWidthHalfNegative()}, speed, options.easing);
                        } else if (wrapper && currentIndex + diff >= pageTotal - 2) {
                            target.transition({marginLeft:0}, speed, options.easing);
                        }
                    }

                    p1.transition({rotateY:'90deg'}, speed/2, options.easeIn, function(){
                        p1.transition({visibility:'hidden'}, 0)
                          .transition({rotateY:'180deg'}, speed/2, options.easeOut);
                        p0.transition({visibility:'visible'}, 0)
                          .transition({rotateY:'0deg'}, speed/2, options.easeOut, updateAfter);
                    });
                    p0.transition({rotateY:'-90deg'}, speed/2, options.easeIn);

                    //todo: handle manual drag
                }
            },
            animateShadows = function (inc, speed, percentage) {
                if (options.shadows) {
                    addShadows(inc);

                    if (inc) {
                        shadowLeft1.css({ opacity: percentage });
                        shadowRight2.css({ opacity: percentage });
                        shadowRight2.stop().animate({ opacity: 0 }, speed, options.easing);
                        shadowRight1.stop().animate({ opacity: percentage }, speed/2, options.easeIn, function(){
                            shadowLeft1.stop().animate({ opacity: 0 }, speed/2, options.easeOut);
                        });
                        shadowLeft2.stop().animate({ opacity: percentage }, speed, options.easing, function () {
                            if (percentage == 0) {
                                removeShadows();
                            }
                        });
                    } else {
                        shadowRight1.css({ opacity: percentage });
                        shadowLeft2.css({ opacity: percentage });
                        shadowLeft2.animate({ opacity: 0 }, speed, options.easeIn);
                        shadowLeft1.stop().animate({ opacity: percentage }, speed/2, options.easeIn, function(){
                            shadowRight1.stop().animate({ opacity: 0 }, speed/2, options.easeOut);
                        });
                        shadowRight2.stop().animate({ opacity: percentage }, speed, options.easing, function () {
                            if (percentage == 0) {
                                removeShadows();
                            }
                        });
                    }
                }
            },
            updateAfter = function () {
                updatePages();
                isBusy = false;

                // callback when ending booklet animation
                if (options.didchange) {
                    target.off(event.didchange + namespace).on(event.didchange + namespace, options.didchange);
                }
                target.trigger(event.didchange, {
                    options: $.extend({}, options),
                    index: currentIndex,
                    pages: [pages[currentIndex].contentNode, pages[currentIndex + 1].contentNode]
                });
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
                // validate inputs
                if (typeof index === 'string') {
                    if (index == "start") {
                        index = 0;
                    } else if (index == "end") {
                        index = pageTotal - 2;
                    } else {
                        this.gotopage(parseInt(index));
                    }
                } else if (typeof index === "number") {
                    if (index < 0 || index >= pageTotal) {
                        return;
                    }
                } else if (typeof index === "undefined") {
                    return;
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
                if (typeof name === 'string') {
                    if (typeof options[name] === 'undefined')
                        $.error('Option "' + name + '" does not exist on jQuery.booklet.');
                    if (typeof value !== 'undefined') {
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
                if (typeof name === 'object') {
                    updateOptions(name);
                    return;
                }
                // return a copy of the options object, to avoid changes
                if (typeof name === 'undefined') {
                    return $.extend({}, options);
                }
            }
        }
    }
})(jQuery);