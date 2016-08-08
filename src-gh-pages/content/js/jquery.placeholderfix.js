/*
 * jQuery placeholderfix
 * Copyright (c) 2009-2010 W. Grauvogel
 */
;(function($) {
		   
$.fn.placeholderfix = function(options) {
	return this.each(function() {
		
		var opts = $.extend({}, $.fn.placeholderfix.defaults, options);
		
		$(this).find('input[type=text], textarea').each(function(){
						
			var txt = $(this).attr('placeholder');
			if(!opts.placeholderSupport && $(this).val() == ""){$(this).val(txt);}
			
			turnOff($(this));
			if($(this).val() != txt && $(this).val() != ""){turnOn($(this));}
				
			$(this).focus(function(){
				if(!opts.placeholderSupport && $(this).val() == txt){$(this).val("");}
				if($(this).val() != txt){turnOn($(this));}
			}).blur(function(){
				if(!opts.placeholderSupport && $(this).val() == ""){$(this).val(txt);}
				if($(this).val() == txt || $(this).val() == ""){turnOff($(this));}
			});
		});
		
		/*$(this).submit(function(){
			$(this).find('input[type=text], textarea').each(function(){
				var txt = $(this).attr('placeholder');
				if(!opts.placeholderSupport && $(this).val() == txt) $(this).val("");
			 });
		});*/
		
		function turnOn(target){
			if(opts.onClass){target.addClass(opts.onClass);}
			if(opts.offClass){target.removeClass(opts.offClass);}
		}
		function turnOff(target){
			if(opts.onClass){target.removeClass(opts.onClass);}
			if(opts.offClass){target.addClass(opts.offClass);}
		}
	});
}

$.fn.placeholderfix.defaults = {
	onClass:            false,
	offClass:           false,
	placeholderSupport: false
}

})(jQuery);