/*
 * jQuery Booklet Plugin
 * Copyright (c) 2010 - 2014 William Grauvogel (http://builtbywill.com/)
 *
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version : 1.4.3
 *
 * Originally based on the work of:
 *	1) Charles Mangin (http://clickheredammit.com/pageflip/)
 */
;(function ($) {

    $.booklet = {
        version: '2.0.0',
        templates : {
            page : {
                blank:   '<div class="b-page b-page-blank"></div>', // transparent page used with closed books
                empty:   '<div class="b-page b-page-empty"></div>', // page with no content
                cover:   '<div class="b-page b-page-cover"></div>', // cover page
                default: '<div class="b-page"></div>' // default page
            },
            shadow : {
                left:  '<div class="b-shadow-left"></div>', // shadow for left handed pages
                right: '<div class="b-shadow-right"></div>' // shadow for right handed pages
            }
        },
        directions : {
            leftToRight: 'LTR',
            rightToLeft: 'RTL'
        },
        events : {
            create: 'bookletcreate', // called when booklet has been created
            willchange: 'bookletwillchange',
            startchange:  'bookletstartchange',  // called when booklet starts to change pages
            didchange: 'bookletdidchange', // called when booklet has finished changing pages
            add:    'bookletadd',    // called when booklet has added a page
            remove: 'bookletremove'  // called when booklet has removed a page
        }
    }

    $.fn.booklet = function (options, param1, param2) {

        var booklet, method, params, output, result, config;

        // option type string - api call
        if (typeof options === 'string') {
            result = [];
            // loop each booklet, adding results to array
            $(this).each(function () {
                booklet = $(this).data('booklet');
                if (booklet) {
                    method = options;
                    // add optional parameters
                    params = [];
                    if (typeof param1 !== 'undefined') {
                        params.push(param1);
                    }
                    if (typeof param2 !== 'undefined') {
                        params.push(param2);
                    }
                    if (booklet[method]) {
                        output = booklet[method].apply(booklet, params);
                        if (typeof output !== 'undefined' || output) {
                            result.push(output);
                        }
                    } else {
                        $.error('Method "' + method + '" does not exist on jQuery.booklet.');
                    }
                } else {
                    $.error('jQuery.booklet has not been initialized. Method "' + options + '" cannot be called.');
                }
            });
            if (result.length == 1) {
                return result[0];
            } else if (result.length > 0) {
                return result;
            } else {
                return $(this);
            }
        }
        // build new booklet
        else {
            return $(this).each(function () {
                booklet = $(this).data('booklet');

                // destroy old booklet if it exists
                if (booklet) {
                    booklet.destroy();
                }

                // instantiate new booklet
                booklet = new Booklet($(this), options);

                // preserve chaining on main function
                return this;
            });
        }
    }

    // default options
    $.fn.booklet.defaults = {
        width:                600,                             // container width
        height:               400,                             // container height
        speed:                2000,                            // speed of the transition between pages
        direction:            'LTR',                           // direction of the overall content organization, default LTR, left to right, can be RTL for languages which read right to left
        startingPage:         0,                               // index of the first page to be displayed
        easing:               'easeInOutQuad',                 // easing method for complete transition
        easeIn:               'easeInQuad',                    // easing method for first half of transition
        easeOut:              'easeOutQuad',                   // easing method for second half of transition

        closed:               false,                           // start with the book "closed", will add empty pages to beginning and end of book
        covers:               false,                           // used with "closed", makes first and last pages into covers, without page numbers (if enabled)
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
    }

    function EventHandler(){}
    EventHandler.prototype = {
        constructor: EventHandler,
        dispatch: function(eventType, target){
            target.trigger(eventType, {
                options: $.extend({}, target.options),
                index: target.options.currentIndex,
                pages: [target.pages[options.currentIndex].contentNode, pages[options.currentIndex + 1].contentNode]
            });
        }
    }

    function OptionManager(options){
        this.options = $.extend({}, $.fn.booklet.defaults, options);;
    }
    OptionManager.prototype = {
        constructor: OptionManager,
        setOptions: function(options){
            this.options = $.extend({}, this.options, options);
            // todo: notify booklet
        },
        getOption: function(name){
            if (typeof options[name] !== 'undefined')
                return this.options[name];
            $.error('Option "' + name + '" does not exist.');
        },
        setOption: function(name, value){
            if (typeof options[name] !== 'undefined') {
                if (typeof value !== 'undefined') {
                    options[name] = value;
                    // todo: notify booklet
                }
            } else {
                $.error('Option "' + name + '" does not exist.');
            }
        }
    }

    function Page(contentNode, index, options)
    {
        this.index = index;
        this.contentNode = contentNode;
        this.isBlank = this.contentNode.hasClass('b-page-blank');
        this.isEmpty = this.contentNode.hasClass('b-page-empty');
        this.isCover = options.closed && options.covers && (index == 1 || index == options.pageTotal - 2);
        this.pageNode = this.createPageNode();

        this.pageNumber = 0;
        this.pageNumberNode = null;
        this.updatePageNumber(index, options);

        if (options.pageNumbers && !this.isEmpty && !this.isCover){
            this.addPageNumberNode();
        }

        return;

        // add page numbers

        if (options.pageNumbers && !this.isEmpty && !this.isCover
            //(options.layoutSingle && !this.isBlank) &&
            //(!options.closed || (options.closed && !options.covers) ||
            //    (options.closed && options.covers && index != 1 && index != options.pageTotal - 2))
            ) {

            /*if (options.direction == $.booklet.directions.leftToRight) {
                startingPageNumber++;
            }

            contentNode.parent().append('<div class="b-counter">' + startingPageNumber + '</div>');

            if (options.direction == $.booklet.directions.rightToLeft) {
                startingPageNumber--;
            }*/
        }
    }

    Page.prototype = {
        constructor: Page,
        createPageNode: function(){
            if (this.isEmpty || this.isBlank) {
                return this.contentNode.addClass('b-page-' + this.index);
            } else if (this.isCover) {
                return this.contentNode.wrap($.booklet.templates.page.cover).parent().addClass('b-page-' + this.index);
            } else {
                return this.contentNode.wrap($.booklet.templates.page.default).parent().addClass('b-page-' + this.index);
            }
        },
        updatePageNumber: function(index, options){
            this.index = index;
            if (options.direction == $.booklet.directions.rightToLeft){
                this.pageNumber = options.pageTotal - index;
            } else {
                this.pageNumber = index + 1;
            }
            if (this.pageNumberNode){
                this.pageNumberNode.text(this.pageNumber);
            }
        },
        addPageNumberNode: function(){
            this.pageNumberNode = $('<div class="b-counter">' + this.pageNumber + '</div>').appendTo(this.pageNode);
        },
        removePageNumberNode: function(){
            if (this.pageNumberNode){
                this.pageNumberNode.remove();
                this.pageNumberNode = null
            }
        },
        destroy: function(){
            this.removeClass('b-page-' + this.index);
            this.removePageNumberNode();
            if (this.isEmpty || this.isBlank)
                this.remove();
            else
                this.contentNode.unwrap();
        }
    }

    function Booklet(target, options) {

        this.target = target;
        this.options = $.extend({}, $.fn.booklet.defaults, options);
        this.optionManager = new OptionManager(options);
        this.pages = [];

        this.originalPageTotal = 0;
        this.created = false;
        this.busy = false;
        this.playing = false;
        this.hoveringRight = false;
        this.hoveringLeft = false;
        this.enabled = true;

        this.init();
    }

    Booklet.prototype = {
        constructor: Booklet,
        init: function () {
            this.target.addClass('booklet');
            this.target.data('booklet', this);

            this.originalPageTotal = this.target.children().length;
            this.options.currentIndex = 0;

            createPages(this);
            updateOptions(this);
            updatePages(this);
            //updateControlVisibility();

            this.created = true;

            // event - create
            if (this.options.create) {
                this.target.off($.booklet.events.create + '.booklet').on($.booklet.events.create + '.booklet', this.options.create);
            }
            this.target.trigger($.booklet.events.create, {
                options: $.extend({}, this.options),
                index: this.options.currentIndex,
                pages: [this.pages[this.options.currentIndex].contentNode, this.pages[this.options.currentIndex + 1].contentNode]
            });
        },
        enable: function () {
            this.enabled = true;
        },
        disable: function () {
            this.enabled = false;
        },
        destroy: function () {
            // destroy all booklet items
            //destroyControls();
            destroyPages(this);

            // clear class from target DOM object
            this.target.removeClass('booklet');

            // clear out booklet from data object
            this.target.removeData('booklet');

            this.created = false;
        }
    }

    function createPages(booklet){
        booklet.pages = [];

        // fix for odd number of pages
        if ((booklet.target.children().length % 2) != 0) {
            // if book is closed and using covers, add page before back cover, else after last page
            //if (options.closed && options.covers) {
            //    booklet.target.children().last().before($.booklet.templates.blank);
            //} else {
                booklet.target.children().last().after($.booklet.templates.blank);
            //}
        }

        // if closed book, add empty pages to start and end
        /*
        if (booklet.options.closed) {
            booklet.target.prepend($.booklet.templates.empty);
            booklet.target.append($.booklet.templates.empty);
        }
        */

        // set total page count
        booklet.options.pageTotal = booklet.target.children().length;

        /*
        // reverse page order
        if (options.direction == $.booklet.directions.rightToLeft) {
            $(booklet.target.children().get().reverse()).each(function () {
                $(this).appendTo(booklet.target);
            });
        }

        if (!booklet.created) {
            // set currentIndex
            if (options.direction == directions.leftToRight) {
                options.currentIndex = 0;
            } else if (options.direction == directions.rightToLeft) {
                options.currentIndex = options.pageTotal - 2;
            }

            if (!isNaN(options.startingPage) && options.startingPage <= options.pageTotal && options.startingPage > 0) {
                if ((options.startingPage % 2) != 0) {
                    options.startingPage--;
                }
                options.currentIndex = options.startingPage;
            }
        }
        */
        /*
         if(options.layoutSingle) {
         target.children().each(function () {
         if(options.direction == directions.leftToRight){
         $(this).before(templates.blank);
         }else{
         $(this).after(templates.blank);
         }
         });
         }
         */

        booklet.target.children().each(function (i) {
            var newPage = new Page($(this), i, booklet.options);
            booklet.pages.push(newPage);
        });
    }

    function destroyPages(booklet) {
        booklet.pages.each(function(){
            this.destroy();
        });
        booklet.pages = [];

        booklet.target.find(".b-page-blank, .b-page-empty").remove();
        //removeShadows();

        // revert page order to original
        /*
        if (options.direction == directions.rightToLeft) {
            $(booklet.target.children().get().reverse()).each(function () {
                $(this).appendTo(target);
            });
        }*/
    }

    function updatePageStructure(booklet) {
        // reset all content
        booklet.target.find('.b-page').removeClass('b-pN b-p0 b-p1 b-p2 b-p3 b-p4').hide();
        //removeShadows();
/*
        // add page classes
        if (booklet.options.currentIndex - 2 >= 0) {
            booklet.target.find('.b-page-' + (options.currentIndex - 2)).addClass('b-pN').show();
            booklet.target.find('.b-page-' + (options.currentIndex - 1)).addClass('b-p0').show();
        }
        booklet.target.find('.b-page-' + (options.currentIndex)).addClass('b-p1').show();
        booklet.target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p2').show();
        if (booklet.options.currentIndex + 3 <= options.pageTotal) {
            booklet.target.find('.b-page-' + (options.currentIndex + 2)).addClass('b-p3').show();
            booklet.target.find('.b-page-' + (options.currentIndex + 3)).addClass('b-p4').show();
        }

        // save structure to vars
        /*
        pN = target.find('.b-pN');
        p0 = target.find('.b-p0');
        p1 = target.find('.b-p1');
        p2 = target.find('.b-p2');
        p3 = target.find('.b-p3');
        p4 = target.find('.b-p4');
        */
    }

    function updatePageCSS(booklet) {
        // update css
        booklet.target.find('.b-p0, .b-p3').css({ 'filter': '', 'zoom': '' });
        /*
        booklet.target.find('.b-page').removeAttr('style').css(css.bPage);
        p1.css(css.p1);
        p2.css(css.p2);
        pN.css(css.pN);
        p0.css(css.p0);
        p3.css(css.p3);
        p4.css(css.p4);

        if (options.closed && options.autoCenter && options.currentIndex == 0) {
            pN.css({ 'left': pWidthN });
            p0.css({ 'left': 0 });
            p1.css({ 'left': pWidthN });
            p2.css({ 'left': 0 });
            p3.css({ 'left': pWidthN });
            p4.css({ 'left': 0 });
        }

        if (options.closed && options.autoCenter && (options.currentIndex == 0 || options.currentIndex >= options.pageTotal - 2)) {
            target.width(pWidth);
        } else {
            target.width(options.width);
        }

        // ie fix
        target.find('.b-page').css({ 'filter': '', 'zoom': '' });*/
    }

    function updatePages(booklet) {
        updatePageStructure(booklet);
        updatePageCSS(booklet);
    }

    function destroyShadows(booklet) {

    }

    function updateOptions(booklet, newOptions){
        var didUpdate = false;

        // update options if newOptions have been passed in
        if (newOptions != null && typeof newOptions != "undefined") {
            // remove page structure, revert to original order
            destroyPages(booklet);

            booklet.options = $.extend({}, booklet.options, newOptions);
            didUpdate = true;

            createPages(booklet);
        }

        updateSizes(booklet.target, booklet.options);
        // update all CSS, as sizes may have changed
        updateCSSandAnimations();

        // update pages after first create
        if (booklet.created) {
            updatePages();
        }

        destroyControls();
        createControls();
        addCustomControlActions();
        addKeyboardControlAction();
        addHashControlAction();
        addResizeControlAction();
        addAutoPlayControlAction();

        // if options were updated force pages and controls to update
        if (didUpdate) {
            updatePages();
            updateControlVisibility();
        }
    }

    function updateSizes(target, options) {
        // set width + height
        if (!options.width) {
            options.width = target.width();
        } else if (typeof options.width == 'string' && options.width.indexOf("px") != -1) {
            options.width = options.width.replace('px', '');
        } else if (typeof options.width == 'string' && options.width.indexOf("%") != -1) {
            //wPercent = true;
            //wOrig = options.width;
            options.width = (options.width.replace('%', '') / 100) * parseFloat(target.parent().css('width'));
        }
        if (!options.height) {
            options.height = target.height();
        } else if (typeof options.height == 'string' && options.height.indexOf("px") != -1) {
            options.height = options.height.replace('px', '');
        } else if (typeof options.height == 'string' && options.height.indexOf("%") != -1) {
            //hPercent = true;
            //hOrig = options.height;
            options.height = (options.height.replace('%', '') / 100) * parseFloat(target.parent().css('height'));
        }
        target.width(options.width);
        target.height(options.height);

        // save page sizes and other vars
        /*
        pWidth = options.width / 2;
        pWidthN = '-' + (pWidth) + 'px';
        pWidthH = pWidth / 2;
        pHeight = options.height;
        speedH = options.speed / 2;
        */

        // set width for closed + autoCenter
        if (options.closed && options.autoCenter) {
            if (options.currentIndex == 0) {
                target.width(options.width / 2);
            } else if (options.currentIndex >= options.pageTotal - 2) {
                target.width(options.width / 2);
            }
        }
    }

    function Old(){
        var css = {}, animations = {},

            currentHash = '', hashRoot = '/page/', hash, i, j, h, a, diff,
            originalPageTotal, startingPageNumber,
        // page content vars
            pN, p0, p1, p2, p3, p4,
        // control vars
            p3drag, p0drag, controls, tabs, tabN, tabP, arrows, arrowN, arrowP, customN, customP, ctrlsN, ctrlsP, pause, play,
            wPercent, wOrig, hPercent, hOrig,
            pWidth, pWidthN, pWidthH, pHeight, speedH,
            shadowLeft1, shadowRight1, shadowLeft2, shadowRight2,

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // OPTIONS + CONTROLS
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            updateSizes = function () {
                // set width + height
                if (!options.width) {
                    options.width = target.width();
                } else if (typeof options.width == 'string' && options.width.indexOf("px") != -1) {
                    options.width = options.width.replace('px', '');
                } else if (typeof options.width == 'string' && options.width.indexOf("%") != -1) {
                    wPercent = true;
                    wOrig = options.width;
                    options.width = (options.width.replace('%', '') / 100) * parseFloat(target.parent().css('width'));
                }
                if (!options.height) {
                    options.height = target.height();
                } else if (typeof options.height == 'string' && options.height.indexOf("px") != -1) {
                    options.height = options.height.replace('px', '');
                } else if (typeof options.height == 'string' && options.height.indexOf("%") != -1) {
                    hPercent = true;
                    hOrig = options.height;
                    options.height = (options.height.replace('%', '') / 100) * parseFloat(target.parent().css('height'));
                }
                target.width(options.width);
                target.height(options.height);

                // save page sizes and other vars
                pWidth = options.width / 2;
                pWidthN = '-' + (pWidth) + 'px';
                pWidthH = pWidth / 2;
                pHeight = options.height;
                speedH = options.speed / 2;

                // set width for closed + autoCenter
                if (options.closed && options.autoCenter) {
                    if (options.currentIndex == 0) {
                        target.width(pWidth);
                    } else if (options.currentIndex >= options.pageTotal - 2) {
                        target.width(pWidth);
                    }
                }
            },
            updateCSSandAnimations = function () {
                // create base css
                css = {
                    bPage: {
                        padding: options.pagePadding,
                        width: pWidth-(2*options.pagePadding),
                        height:  pHeight-(2*options.pagePadding),
                        visibility: 'hidden'
                    },
                    pN: {
                        left:0,
                        '-webkit-transform': 'rotateY(0deg)',
                        '-moz-transform': 'rotateY(0deg)',
                        'transform': 'rotateY(0deg)'
                    },
                    p0: {
                        left:pWidth,
                        '-webkit-transform': 'rotateY(-180deg)',
                        '-moz-transform': 'rotateY(-180deg)',
                        'transform': 'rotateY(-180deg)'
                    },
                    p1: {
                        left: 0,
                        '-webkit-transform': 'rotateY(0deg)',
                        '-moz-transform': 'rotateY(0deg)',
                        'transform': 'rotateY(0deg)',
                        visibility: 'visible'
                    },
                    p2: {
                        left: pWidth,
                        '-webkit-transform': 'rotateY(0deg)',
                        '-moz-transform': 'rotateY(0deg)',
                        'transform': 'rotateY(0deg)',
                        visibility: 'visible'
                    },
                    p3: {
                        left:0,
                        '-webkit-transform': 'rotateY(180deg)',
                        '-moz-transform': 'rotateY(180deg)',
                        'transform': 'rotateY(180deg)'
                    },
                    p4: {
                        left:pWidth,
                        '-webkit-transform': 'rotateY(0deg)',
                        '-moz-transform': 'rotateY(0deg)',
                        'transform': 'rotateY(0deg)'
                    },
                    shadow: {
                        width: pWidth,
                        height: pHeight
                    }
                };

                // create animation params
                anim = {
                    hover: {
                        speed: options.hoverSpeed,
                        size: options.hoverWidth
                    }
                };
            },

            createControls = function () {
                // add controls container
                controls = target.find('.b-controls');
                if (controls.length == 0) {
                    controls = $('<div class="b-controls"></div>').appendTo(target);
                }

                // create controls
                createTabControls();
                createArrowControls();

                // save all controls
                ctrlsN = controls.find('.b-next');
                ctrlsP = controls.find('.b-prev');

                addControlActions();
            },
            createTabControls = function () {
                // add tabs
                tabs = target.find('.b-tab');
                if (options.tabs && tabs.length == 0) {
                    tabP = $('<div class="b-tab b-tab-prev b-prev" title="' + options.previousControlTitle + '">' + options.previousControlText + '</div>').appendTo(controls);
                    tabN = $('<div class="b-tab b-tab-next b-next" title="' + options.nextControlTitle + '">' + options.nextControlText + '</div>').appendTo(controls);
                    tabs = target.find('.b-tab');
                } else if (!options.tabs) {
                    target.css({ 'marginTop': 0 });
                    tabs.remove();
                    tabs = null;
                }

                // update tab css, options might have changed
                if (options.tabs && tabs.length > 0) {
                    if (options.tabWidth) {
                        tabs.width(options.tabWidth);
                    }
                    if (options.tabHeight) {
                        tabs.height(options.tabHeight);
                    }

                    tabs.css({ 'top': '-' + tabN.outerHeight() + 'px' });
                    target.css({ 'marginTop': tabN.outerHeight() });

                    // update control titles for RTL direction
                    if (options.direction == directions.rightToLeft) {
                        tabN.html(options.previousControlText).attr('title', options.previousControlTitle);
                        tabP.html(options.nextControlText).attr('title', options.nextControlTitle);
                    }
                }
            },
            createArrowControls = function () {
                // add arrows
                arrows = target.find('.b-arrow');
                if (options.arrows && arrows.length == 0) {
                    arrowP = $('<div class="b-arrow b-arrow-prev b-prev" title="' + options.previousControlTitle + '"><div>' + options.previousControlText + '</div></div>').appendTo(controls);
                    arrowN = $('<div class="b-arrow b-arrow-next b-next" title="' + options.nextControlTitle + '"><div>' + options.nextControlText + '</div></div>').appendTo(controls);
                    arrows = target.find('.b-arrow');

                    // update control titles for RTL direction
                    if (options.direction == directions.rightToLeft) {
                        arrowN.html('<div>' + options.previousControlText + '</div>').attr('title', options.previousControlTitle);
                        arrowP.html('<div>' + options.nextControlText + '</div>').attr('title', options.nextControlTitle);
                    }
                } else if (!options.arrows) {
                    arrows.remove();
                    arrows = null;
                }
            },

            addControlActions = function () {

                // add click actions
                ctrlsN.on('click.booklet', function (e) {
                    e.preventDefault();
                    next();
                });
                ctrlsP.on('click.booklet', function (e) {
                    e.preventDefault();
                    prev();
                });

                // add page hover animations
                if (options.hovers) {
                    // mouse tracking for page movement
                    target.on('mousemove.booklet',function (e) {
                        diff = e.pageX - target.offset().left;
                        if (options.overlays) {
                            if (diff < pWidth && options.currentIndex != 0) {
                                if (isHoveringRight) endHoverAnimation(true);
                                startHoverAnimation(false);
                            } else if (diff > pWidth && options.currentIndex + 2 < options.pageTotal) {
                                if (isHoveringLeft) endHoverAnimation(false);
                                startHoverAnimation(true);
                            } else {
                                endHoverAnimation(false);
                                endHoverAnimation(true);
                            }
                        } else {
                            if (diff < anim.hover.size) {
                                startHoverAnimation(false);
                            } else if (diff > pWidth - anim.hover.size && options.currentIndex == 0 && options.autoCenter && options.closed) {
                                startHoverAnimation(true);
                            } else if (diff > anim.hover.size && diff <= options.width - anim.hover.size) {
                                endHoverAnimation(false);
                                endHoverAnimation(true);
                            } else if (diff > options.width - anim.hover.size) {
                                startHoverAnimation(true);
                            }
                        }
                    }).on('mouseleave.booklet', function () {
                        endHoverAnimation(false);
                        endHoverAnimation(true);
                    });
                }

                // add overlay or hover click action
                if (options.overlays || options.hovers) {
                    // mouse tracking for page movement
                    target.on('click.booklet',function (e) {
                        diff = e.pageX - target.offset().left;
                        if (diff < pWidth && options.currentIndex != 0) {
                            if (options.overlays)
                                e.preventDefault();
                            prev();
                        } else if (diff > pWidth && options.currentIndex + 2 < options.pageTotal) {
                            if (options.overlays)
                                e.preventDefault();
                            next();
                        }
                    });
                }

                // add arrow animations
                if (options.arrows) {
                    if (options.arrowsHide) {
                        ctrlsN.on('mouseover.booklet', function () {
                            arrowN.find('div').stop().fadeTo('fast', 1);
                        }).on('mouseout.booklet', function () {
                            arrowN.find('div').stop().fadeTo('fast', 0);
                        });
                        ctrlsP.on('mouseover.booklet', function () {
                            arrowP.find('div').stop().fadeTo('fast', 1);
                        }).on('mouseout.booklet', function () {
                            arrowP.find('div').stop().fadeTo('fast', 0);
                        });
                    } else {
                        arrowN.find('div').show();
                        arrowP.find('div').show();
                    }
                }
            },
            addCustomControlActions = function () {
                if (options.next && $(options.next).length > 0) {
                    customN = $(options.next);
                    customN.on('click.booklet', function (e) {
                        e.preventDefault();
                        next();
                    });
                }
                if (options.prev && $(options.prev).length > 0) {
                    customP = $(options.prev);
                    customP.on('click.booklet', function (e) {
                        e.preventDefault();
                        prev();
                    });
                }
            },
            addKeyboardControlAction = function () {
                $(document).on('keyup.booklet', function (event) {
                    if (event.keyCode == 37 && options.keyboard) {
                        prev();
                    } else if (event.keyCode == 39 && options.keyboard) {
                        next();
                    }
                });
            },

            addHashControlAction = function () {
                clearInterval(h);
                h = null;
                if (options.hash) {
                    initHash();
                    clearInterval(h);
                    h = setInterval(function () {
                        pollHash()
                    }, 250);
                }
            },
            initHash = function () {
                hash = getHashNum();

                if (!isNaN(hash) && hash <= options.pageTotal - 1 && hash >= 0 && hash != '') {
                    if ((hash % 2) != 0) {
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

                // check page num
                if (!isNaN(hash) && hash <= options.pageTotal - 1 && hash >= 0) {
                    if (hash != options.currentIndex && hash.toString() != currentHash) {
                        if ((hash % 2) != 0) {
                            hash--
                        }

                        document.title = options.name + options.hashTitleText + (hash + 1);

                        if (!isBusy) {
                            goToPage(hash);
                            currentHash = hash;
                        }
                    }
                }
            },
            getHashNum = function () {
                var hash, hashNum;
                // get page number from hash tag, last element
                hash = window.location.hash.split('/');
                if (hash.length > 1) {
                    hashNum = parseInt(hash[2]) - 1;
                    if (options.direction == directions.rightToLeft) {
                        hashNum = Math.abs(hashNum + 1 - options.pageTotal);
                    }
                    return hashNum;
                } else {
                    return '';
                }
            },
            updateHash = function (hash, options) {
                // set the hash
                if (options.hash) {
                    if (options.direction == directions.rightToLeft) {
                        hash = Math.abs(hash - options.pageTotal);
                    }
                    window.location.hash = hashRoot + hash;
                }
            },

            addResizeControlAction = function () {
                // percentage resizing
                $(window).on('resize.booklet', function () {
                    if ((wPercent || hPercent)) {
                        updatePercentageSize();
                    }
                });

            },
            addAutoPlayControlAction = function () {
                // auto flip book controls
                if (options.auto && options.delay) {
                    clearInterval(a);
                    a = setInterval(function () {
                        if (options.direction == directions.leftToRight) {
                            next();
                        } else {
                            prev();
                        }
                    }, options.delay);
                    isPlaying = true;

                    if (options.pause && $(options.pause).length > 0) {
                        pause = $(options.pause);
                        pause.off('click.booklet')
                            .on('click.booklet', function (e) {
                                e.preventDefault();
                                if (isPlaying) {
                                    clearInterval(a);
                                    isPlaying = false;
                                }
                            });
                    }

                    if (options.play && $(options.play).length > 0) {
                        play = $(options.play);
                        play.off('click.booklet')
                            .on('click.booklet', function (e) {
                                e.preventDefault();
                                if (!isPlaying) {
                                    clearInterval(a);
                                    a = setInterval(function () {
                                        if (options.direction == directions.leftToRight) {
                                            next();
                                        } else {
                                            prev();
                                        }
                                    }, options.delay);
                                    isPlaying = true;
                                }
                            });
                    }
                } else {
                    clearInterval(a);
                    a = null;
                    if (options.pause && $(options.pause).length > 0) {
                        $(options.pause).off('click.booklet');
                    }
                    pause = null;
                    if (options.play && $(options.play).length > 0) {
                        $(options.play).off('click.booklet');
                    }
                    play = null;
                    isPlaying = false;
                }
            },

            destroyControls = function () {

                if (customN) {
                    customN.off('click.booklet');
                    customN = null;
                }
                if (customP) {
                    customP.off('click.booklet');
                    customP = null;
                }
                if (ctrlsN) {
                    ctrlsN.off(".booklet");
                    ctrlsN = null;
                }
                if (ctrlsP) {
                    ctrlsP.off(".booklet");
                    ctrlsP = null;
                }
                
                target.find('.b-controls').remove();
                controls = tabs = tabN = tabP = arrows = arrowN = arrowP = null;

                // keyboard
                $(document).off('keyup.booklet');

                // hash
                clearInterval(h);
                h = null;

                // window resize
                $(window).off('resize.booklet');

                // auto play
                clearInterval(a);
                a = null;
                if (options.pause && $(options.pause).length > 0) {
                    $(options.pause).off('click.booklet');
                }
                pause = null;
                if (options.play && $(options.play).length > 0) {
                    $(options.play).off('click.booklet');
                }
                play = null;

                // remove mouse tracking for page movement and hover clicks
                target.off('.booklet');

                destroyManualControls();
            },

            updatePercentageSize = function () {
                if (!isDisabled) {
                    // recalculate size for percentage values, called with window is resized
                    if (wPercent) {
                        options.width = (wOrig.replace('%', '') / 100) * parseFloat(target.parent().css('width'));
                        target.width(options.width);
                        pWidth = options.width / 2;
                        pWidthN = '-' + (pWidth) + 'px';
                        pWidthH = pWidth / 2;
                    }
                    if (hPercent) {
                        options.height = (hOrig.replace('%', '') / 100) * parseFloat(target.parent().css('height'));
                        target.height(options.height);
                        pHeight = options.height;
                    }
                    updateCSSandAnimations();
                    updatePageCSS();
                }
            },
            updateControlVisibility = function () {
                // update controls, cursors and visibility
                if (options.overlays || options.tabs || options.arrows) {
                    if (options.currentIndex >= 2 && options.currentIndex != 0) {
                        ctrlsP.fadeIn('fast').css('cursor', options.cursor);
                    } else {
                        ctrlsP.fadeOut('fast').css('cursor', 'default');
                    }
                    if (options.currentIndex < options.pageTotal - 2) {
                        ctrlsN.fadeIn('fast').css('cursor', options.cursor);
                    } else {
                        ctrlsN.fadeOut('fast').css('cursor', 'default');
                    }
                }
            },

            updateManualControls = function () {
	/*
                var origX, newX, diff, fullPercent, shadowPercent, shadowW, curlW, underW, targetPercent, curlLeft, p1wrapLeft;

                // reset vars
                isHoveringRight = isHoveringLeft = p3drag = p0drag = false;

                if ($.ui) {
                    // manual page turning, check if jQuery UI is loaded
                    if (target.find('.b-page').draggable()) {
                        target.find('.b-page').draggable('destroy').removeClass('b-grab b-grabbing');
                    }
                    if (options.manual) {
                        // implement draggable forward
                        p3.draggable({
                            axis: "x",
                            containment: [
                                target.offset().left,
                                0,
                                p2.offset().left + pWidth - hoverFullWidth,
                                pHeight
                            ],
                            drag: function (event, ui) {
                                p3drag = true;
                                p3.removeClass('b-grab').addClass('b-grabbing');

                                // calculate positions
                                origX = ui.originalPosition.left;
                                newX = ui.position.left;
                                diff = origX - newX;
                                fullPercent = diff / origX;
                                shadowPercent = fullPercent < 0.5 ? fullPercent : (1 - fullPercent);
                                shadowW = (shadowPercent * options.shadowBtmWidth * 2) + hoverShadowWidth;
                                shadowW = diff / origX >= 0.5 ? shadowW -= hoverShadowWidth : shadowW;

                                // move shadows
                                if (options.shadows) {
                                    sF.css({'right': '-' + (options.shadowTopFwdWidth * shadowPercent * 2) + 'px'});
                                    if ($.support.opacity) {
                                        sF.css({'opacity': shadowPercent * 2});
                                    } else {
                                        sF.css({'right': 'auto', 'left': 0.1 * p3.width()});
                                    }
                                }

                                // set top page curl width
                                curlW = hoverCurlWidth + diff / 2;
                                curlW = curlW > pWidth ? pWidth : curlW; // constrain max width

                                // set bottom page width, hide
                                underW = pWidth - curlW;

                                // calculate positions for closed and auto-centered book
                                if (options.closed && options.autoCenter) {
                                    if (options.currentIndex == 0) {
                                        targetPercent = 0.5 + 0.5 * fullPercent;
                                        curlW = hoverCurlWidth + (hoverCurlWidth * fullPercent) + diff;
                                        curlW = curlW > pWidth ? pWidth : curlW;
                                        underW = pWidth - curlW;

                                        p2.css({left: pWidth * fullPercent});
                                        p4.css({left: pWidth * fullPercent});
                                        target.width(options.width * targetPercent);
                                    } else if (options.currentIndex == options.pageTotal - 4) {
                                        targetPercent = (1 - fullPercent) + 0.5 * fullPercent;
                                        underW = pWidth - curlW;

                                        p4.hide();
                                        target.width(options.width * targetPercent);
                                    } else {
                                        target.width(options.width);
                                    }
                                }

                                // set values
                                p3.width(curlW);
                                p3wrap.css({left: shadowW});
                                p2.width(underW);
                            },
                            stop: function () {
                                endHoverAnimation(false);
                                if (fullPercent > options.hoverThreshold) {
                                    if (options.shadows && !$.support.opacity) {
                                        sF.css({'left': 'auto', opacity: 0});
                                    }
                                    next();
                                    p3.removeClass('b-grab b-grabbing');
                                } else {
                                    p3drag = false;
                                    p3.removeClass('b-grabbing').addClass('b-grab');

                                    sF.animate({left: 'auto', opacity: 0}, anim.hover.speed, options.easing).css(css.sF);

                                    if (options.closed && options.autoCenter) {
                                        if (options.currentIndex == 0) {
                                            p2.animate({left: 0}, anim.hover.speed, options.easing);
                                            p4.animate({left: 0}, anim.hover.speed, options.easing);
                                            target.animate({width: options.width * 0.5}, anim.hover.speed, options.easing);
                                        } else {
                                            target.animate({width: options.width}, anim.hover.speed, options.easing);
                                        }
                                    }
                                }
                            }
                        });

                        // implement draggable backwards
                        p0.draggable({
                            axis: "x",
                            //containment: 'parent',
                            containment: [
                                target.offset().left + hoverCurlWidth,
                                0,
                                target.offset().left + options.width,
                                pHeight
                            ],
                            drag: function (event, ui) {
                                p0drag = true;
                                p0.removeClass('b-grab').addClass('b-grabbing');

                                // calculate positions
                                origX = ui.originalPosition.left;
                                newX = ui.position.left;
                                diff = newX - origX;
                                fullPercent = diff / (options.width - origX);
                                if (options.closed && options.autoCenter && options.currentIndex == 2) {
                                    fullPercent = diff / (pWidth - origX);
                                }
                                if (fullPercent > 1) {
                                    fullPercent = 1;
                                }

                                shadowPercent = fullPercent < 0.5 ? fullPercent : (1 - fullPercent);
                                shadowW = (shadowPercent * options.shadowBtmWidth * 2) + hoverShadowWidth;
                                shadowW = diff / origX >= 0.5 ? shadowW -= hoverShadowWidth : shadowW;

                                if (options.shadows) {
                                    if ($.support.opacity) {
                                        sB.css({'opacity': shadowPercent * 2});
                                    } else {
                                        sB.css({'left': options.shadowTopBackWidth * shadowPercent * 2});
                                    }
                                }

                                curlW = fullPercent * (pWidth - hoverCurlWidth) + hoverCurlWidth + shadowW;
                                curlLeft = curlW - shadowW;
                                p1wrapLeft = -curlLeft;

                                // calculate positions for closed and auto-centered book
                                if (options.closed && options.autoCenter) {
                                    if (options.currentIndex == 2) {
                                        targetPercent = (1 - fullPercent) + 0.5 * fullPercent;
                                        curlLeft = (1 - fullPercent) * curlLeft;
                                        p1wrapLeft = -curlLeft - (options.width - (options.width * targetPercent));
                                        pN.hide();
                                        p2.css({left: pWidth * (1 - fullPercent)});
                                        p4.css({left: pWidth * (1 - fullPercent)});
                                        target.width(options.width * targetPercent);
                                    } else if (options.currentIndex == options.pageTotal - 2) {
                                        targetPercent = 0.5 + 0.5 * fullPercent;
                                        target.width(options.width * targetPercent);
                                    } else {
                                        target.width(options.width);
                                    }
                                }

                                // set values
                                ui.position.left = curlLeft;
                                p0.css({width: curlW});
                                p0wrap.css({right: shadowW});
                                p1.css({left: curlLeft, width: pWidth - curlLeft});
                                p1wrap.css({left: p1wrapLeft});
                            },
                            stop: function () {
                                endHoverAnimation(true);
                                if (fullPercent > options.hoverThreshold) {
                                    prev();
                                    p0.removeClass('b-grab b-grabbing');
                                } else {
                                    sB.animate({opacity: 0}, anim.hover.speed, options.easing).css(css.sB);
                                    p0drag = false;
                                    p0.removeClass('b-grabbing').addClass('b-grab');

                                    if (options.closed && options.autoCenter) {
                                        if (options.currentIndex == 2) {
                                            p2.animate({left: pWidth}, anim.hover.speed * 2, options.easing);
                                            p4.animate({left: pWidth}, anim.hover.speed * 2, options.easing);
                                            target.animate({width: options.width}, anim.hover.speed * 2, options.easing);
                                        } else if (options.currentIndex == options.pageTotal - 2) {
                                            target.animate({width: options.width * 0.5}, anim.hover.speed, options.easing);
                                        }
                                    }
                                }
                            }
                        });

                        target.find('.b-page').off('click.booklet');
                        if (options.hoverClick) {
                            target.find('.b-pN, .b-p0').on('click.booklet', prev).css({cursor: 'pointer'});
                            target.find('.b-p3, .b-p4').on('click.booklet', next).css({cursor: 'pointer'});
                        }

                        // mouse tracking for page movement
                        target.off('mousemove.booklet').on('mousemove.booklet',function (e) {
                            diff = e.pageX - target.offset().left;
                            if (diff < anim.hover.size) {
                                startHoverAnimation(false);
                            } else if (diff > pWidth - anim.hover.size && options.currentIndex == 0 && options.autoCenter && options.closed) {
                                startHoverAnimation(true);
                            } else if (diff > anim.hover.size && diff <= options.width - anim.hover.size) {

                                endHoverAnimation(false);
                                endHoverAnimation(true);
                            } else if (diff > options.width - anim.hover.size) {
                                startHoverAnimation(true);
                            }
                        }).off('mouseleave.booklet').on('mouseleave.booklet', function () {
                                endHoverAnimation(false);
                                endHoverAnimation(true);
                            });

                    }
                }
*/
            },
            destroyManualControls = function () {
                if ($.ui) {
                    // remove old draggables
                    if (target.find('.b-page').draggable()) {
                        target.find('.b-page').draggable('destroy').removeClass('b-grab b-grabbing');
                    }
                }
            },

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // DYNAMIC FUNCTIONS
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            addPage = function (index, html) {
                // validate inputs
                if (index == "start") {
                    index = 0;
                } else if (index == "end") {
                    index = originalPageTotal;
                } else if (typeof index == "number") {
                    if (index < 0 || index > originalPageTotal) {
                        return;
                    }
                } else if (typeof index == "undefined") {
                    return;
                }

                if (typeof html == "undefined" || html == '') {
                    return;
                }

                // remove page structure, revert to original order
                destroyPages();
                destroyControls();

                // add new page
                if (options.closed && options.covers && index == originalPageTotal) {
                    //end of closed-covers book
                    target.children(':eq(' + (index - 1) + ')').before(html);
                } else if (options.closed && options.covers && index == 0) {
                    //start of closed-covers book
                    target.children(':eq(' + index + ')').after(html);
                } else if (index == originalPageTotal) {
                    //end of book
                    target.children(':eq(' + (index - 1) + ')').after(html);
                } else {
                    target.children(':eq(' + index + ')').before(html);
                }

                originalPageTotal = target.children().length;

                // callback for adding page, returns options, index and the page node
                callback = {
                    options: $.extend({}, options),
                    index: index,
                    page: target.children(':eq(' + index + ')')[0]
                };
                if (options.add) {
                    target.off(events.add + '.booklet').on(events.add + '.booklet', options.add);
                }
                target.trigger(events.add, callback);

                // recall initialize functions
                initPages();
                updateOptions();
                updatePages();
                updateControlVisibility();
            },
            removePage = function (index) {
                // validate inputs
                if (index == "start") {
                    index = 0;
                } else if (index == "end") {
                    index = originalPageTotal;
                } else if (typeof index == "number") {
                    if (index < 0 || index > originalPageTotal) {
                        return;
                    }
                } else if (typeof index == "undefined") {
                    return;
                }

                // stop if removing last remaining page
                if (target.children('.b-page').length == 2 && target.find('.b-page-blank').length > 0) {
                    return;
                }

                // remove page structure, revert to original order
                destroyPages();
                destroyControls();

                if (index >= options.currentIndex) {
                    if (index > 0 && (index % 2) != 0) {
                        options.currentIndex -= 2;
                    }
                    if (options.currentIndex < 0) {
                        options.currentIndex = 0;
                    }
                }

                var removedPage;

                // remove page
                if (options.closed && options.covers && index == originalPageTotal) {
                    // end of closed-covers book
                    removedPage = target.children(':eq(' + (index - 1) + ')').remove();
                } else if (options.closed && options.covers && index == 0) {
                    // start of closed-covers book
                    removedPage = target.children(':eq(' + index + ')').remove();
                } else if (index == originalPageTotal) {
                    // end of book
                    removedPage = target.children(':eq(' + (index - 1) + ')').remove();
                } else {
                    removedPage = target.children(':eq(' + index + ')').remove();
                }

                originalPageTotal = target.children().length;

                // callback for removing page, returns options, index and the page node
                callback = {
                    options: $.extend({}, options),
                    index: index,
                    page: removedPage[0]
                };
                if (options.remove) {
                    target.off(events.remove + '.booklet').on(events.remove + '.booklet', options.remove);
                }
                target.trigger(events.remove, callback);

                removedPage = null;

                // recall initialize functions
                initPages();
                updatePages();
                updateOptions();
                updateControlVisibility();
            },

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // ANIMATION FUNCTIONS
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            next = function () {
                if (!isBusy && !isDisabled) {
                    if (isPlaying && options.currentIndex + 2 >= options.pageTotal) {
                        goToPage(0);
                    } else {
                        goToPage(options.currentIndex + 2);
                    }
                }
            },
            prev = function () {
                if (!isBusy && !isDisabled) {
                    if (isPlaying && options.currentIndex - 2 < 0) {
                        goToPage(options.pageTotal - 2);
                    } else {
                        goToPage(options.currentIndex - 2);
                    }
                }
            },
            goToPage = function (newIndex) {
                var speed;
                if (newIndex < options.pageTotal && newIndex >= 0 && !isBusy && !isDisabled) {
                    if (newIndex > options.currentIndex) {
                        isBusy = true;
                        diff = newIndex - options.currentIndex;
                        options.currentIndex = newIndex;
                        options.movingForward = true;
                        // set animation speed, depending if user dragged any distance or not
                        speed = p3drag === true ? options.speed * (p3.width() / pWidth) : speedH;
                    } else if (newIndex < options.currentIndex) {
                        isBusy = true;
                        diff = options.currentIndex - newIndex;
                        options.currentIndex = newIndex;
                        options.movingForward = false;
                        // set animation speed, depending if user dragged any distance or not
                        speed = p0drag === true ? options.speed * (p0.width() / pWidth) : speedH;
                    }

                    // callback when starting booklet animation
                    callback = {
                        options: $.extend({}, options),
                        index: newIndex,
                        pages: [pages[newIndex].contentNode, pages[newIndex + 1].contentNode]
                    };
                    if (options.start) {
                        target.off(events.start + '.booklet').on(events.start + '.booklet', options.start);
                    }
                    target.trigger(events.start, callback);

                    updateHash(options.currentIndex + 1, options);
                    if (newIndex == options.pageTotal - 2 || newIndex == 0) {
                        updateControlVisibility();
                    }
                    
                    setupPagesBeforeAnimation(diff, options.movingForward);
                    animatePages(diff, options.movingForward, speed);
                    animateShadows(options.movingForward, speed, 1);
                }
            },
            startHoverAnimation = function (inc) {
                if (!isDisabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!isBusy && !isHoveringRight && !p3drag && options.currentIndex + 2 <= options.pageTotal - 2) {
                            p4.css({visibility:'visible'});
                            p2.stop().transition({rotateY:'-10deg'}, anim.hover.speed, options.easing);
                            animateShadows(inc, anim.hover.speed, 0.10);
                            isHoveringRight = true;
                        }
                    } else {
                        if (!isBusy && !isHoveringLeft && !p0drag && options.currentIndex - 2 >= 0) {
                            pN.css({visibility:'visible'});
                            p1.stop().transition({rotateY:'10deg'}, anim.hover.speed, options.easing);
                            animateShadows(inc, anim.hover.speed, 0.10);
                            isHoveringLeft = true;
                        }
                    }
                }
            },
            endHoverAnimation = function (inc) {
                if (!isDisabled && (options.hovers || options.manual)) {
                    if (inc) {
                        if (!isBusy && isHoveringRight && !p3drag && options.currentIndex + 2 <= options.pageTotal - 2) {
                            p4.css({visibility:'hidden'});
                            p2.stop().transition({rotateY:'0deg'}, anim.hover.speed, options.easing);
                            animateShadows(inc, anim.hover.speed, 0);
                            isHoveringRight = false;
                        }
                    } else {
                        if (!isBusy && isHoveringLeft && !p0drag && options.currentIndex - 2 >= 0) {
                            pN.css({visibility:'hidden'});
                            p1.stop().transition({rotateY:'0deg'}, anim.hover.speed, options.easing);
                            animateShadows(inc, anim.hover.speed, 0);
                            isHoveringLeft = false;
                        }
                    }
                }
            },
            animatePages = function(diff, inc, speed) {

                // animate booklet width
                if (options.closed && options.autoCenter) {
                    if (options.currentIndex == 0) {
                        target.animate({ width: pWidth }, speed, options.easing);
                    } else if (options.currentIndex >= options.pageTotal - 2) {
                        target.animate({ width: pWidth }, speed, options.easing);
                    } else {
                        target.animate({ width: options.width }, speed, options.easing);
                    }
                }

                if (inc) {
                    p4.css({visibility:'visible'});
                    
                    var opening = options.closed && options.autoCenter && options.currentIndex - diff == 0;
                    if (opening) {
                        p1.transition({left:0}, speed, options.easing);
                        p4.transition({left:pWidth}, speed, options.easing);
                    }

                    p2.transition({rotateY:'-90deg', left: opening ? pWidthH : p2.css('left')}, speed/2, options.easeIn, function(){
                        p2.transition({visibility:'hidden'}, 0)
                          .transition({left: opening ? pWidth : p2.css('left')}, speed/2, options.easeIn); 
              
                        p3.transition({visibility:'visible'}, 0)
                          .transition({rotateY:'0deg', left: opening ? 0 : p3.css('left')}, speed/2, options.easeOut, function(){updateAfter()});              
                    });
                    p3.transition({rotateY:'90deg', left: opening ? -(pWidthH) : p3.css('left')}, speed/2, options.easeIn);

                    //todo: handle manual drag

                } else {
                    pN.css({visibility:'visible'});

                    var closing = options.closed && options.autoCenter && options.currentIndex == 0;
                    if (closing) {
                        pN.transition({left:pWidthN}, speed, options.easing);
                        p2.transition({left:0}, speed, options.easing);
                    }

                    p1.transition({rotateY:'90deg', left: closing ? -(pWidthH) : p1.css('left')}, speed/2, options.easeIn, function(){
                        p1.transition({visibility:'hidden'}, 0)
                          .transition({rotateY:'180deg', left: closing ? 0 : p1.css('left')}, speed/2, options.easeOut);
                        p0.transition({visibility:'visible'}, 0)
                          .transition({rotateY:'0deg', left: closing ? 0 : p0.css('left')}, speed/2, options.easeOut, function(){updateAfter()});                        
                    });
                    p0.transition({rotateY:'-90deg', left: closing ? pWidthH : p0.css('left')}, speed/2, options.easeIn);

                    //todo: handle manual drag
                }
            },
            addShadows = function (inc) {
                if ((inc && p3.find('.b-shadow-left').length == 0) || (!inc && p1.find('.b-shadow-left').length == 0)) {
                    shadowLeft1 = $(templates.shadowLeft).appendTo(inc ? p3 : p1).css(css.shadow);
                }
                if ((inc && p2.find('.b-shadow-right').length == 0) || (!inc && p0.find('.b-shadow-right').length == 0)) {
                    shadowRight1 = $(templates.shadowRight).appendTo(inc ? p2: p0).css(css.shadow);
                }
                if ((inc && p1.find('.b-shadow-left').length == 0) || (!inc && pN.find('.b-shadow-left').length == 0)) {
                    shadowLeft2 = $(templates.shadowLeft).appendTo(inc ? p1 : pN).css(css.shadow);
                }
                if ((inc && p4.find('.b-shadow-right').length == 0) || (!inc && p2.find('.b-shadow-right').length == 0)) {
                    shadowRight2 = $(templates.shadowRight).appendTo(inc ? p4: p2).css(css.shadow);
                }
            },
            removeShadows = function (inc) {
                target.find('.b-shadow-left, .b-shadow-right').remove();
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
            setupPagesBeforeAnimation = function (diff, inc) {

                if (inc && diff > 2) {
                    // initialize next 2 pages, if jumping forward in the book
                    target.find('.b-p3, .b-p4').removeClass('b-p3 b-p4').hide();
                    target.find('.b-page-' + options.currentIndex).addClass('b-p3').show().stop().css(css.p3);
                    target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p4').show().css(css.p4);
                    p3 = target.find('.b-p3');
                    p4 = target.find('.b-p4');

					// todo: handle hovering

                } else if (!inc && diff > 2) {
                    // initialize previous 2 pages, if jumping backwards in the book
                    target.find('.b-pN, .b-p0').removeClass('b-pN b-p0').hide();
                    target.find('.b-page-' + options.currentIndex).addClass('b-pN').show().css(css.pN);
                    target.find('.b-page-' + (options.currentIndex + 1)).addClass('b-p0').show().css(css.p0);
                    pN = target.find('.b-pN');
                    p0 = target.find('.b-p0');

                    // todo: handle hovering
                }
            },
            updateAfter = function () {
                updatePages();
                updateControlVisibility();
                isBusy = false;

                // callback when ending booklet animation
                callback = {
                    options: $.extend({}, options),
                    index: options.currentIndex,
                    pages: [pages[options.currentIndex].contentNode, pages[options.currentIndex + 1].contentNode]
                };
                if (options.change) {
                    target.off(events.change + '.booklet').on(events.change + '.booklet', options.change);
                }
                target.trigger(events.change, callback);
            };

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PUBLIC FUNCTIONS
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        return {
            init: create,
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
                        index = options.pageTotal - 2;
                    } else {
                        this.gotopage(parseInt(index));
                    }
                } else if (typeof index === "number") {
                    if (index < 0 || index >= options.pageTotal) {
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
                if (options.direction == directions.rightToLeft) {
                    index = Math.abs(index - options.pageTotal) - 2;
                }
                goToPage(index);
            },
            add: addPage,
            remove: removePage,
            option: function (name, value) {
                if (typeof name === 'string') {
                    // if option exists
                    if (typeof options[name] !== 'undefined') {
                        if (typeof value !== 'undefined') {
                            // if value is sent in, set the option value and update options
                            options[name] = value;
                            updateOptions();
                            
                            // todo: only update specific option
                            
                        } else {
                            // if no value sent in, get the current option value
                            return options[name];
                        }
                    } else {
                        $.error('Option "' + name + '" does not exist on jQuery.booklet.');
                    }
                } else if (typeof name === 'object') {
                    // if sending in an object, update options
                    updateOptions(name);
                } else if (typeof name === 'undefined' || !name) {
                    // return a copy of the options object, to avoid changes
                    return $.extend({}, options);
                }
            }
        }
    }

})(jQuery);