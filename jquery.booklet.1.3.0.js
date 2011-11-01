(function($){

	$.fn.booklet = function(method){  
      
		if(methods[method]){
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		}else if(typeof method === 'object' || !method ){
			return methods.init.apply( this, arguments );
		}else{
			$.error( 'Method ' +  method + ' does not exist on jQuery.booklet' );
		} 

	};

	//plugin default settings
	var defaults = {
		duration: 500,
		easing: 'easeInOutQuad'
	}
	
	//plugin methods
	var methods = {
		init: function(options){
			return this.each(function(){
									  
				var $this = $(this), 
				    data = $this.data('presentation'), settings;
				
				//if not already initialized
				if(!data){
					
					//get settings
					settings = $.extend({}, defaults, options);
					
					//init
					$this
					.addClass('slides')
					.data('presentation', {
						target: $this,
						current: 0,
						total: $(this).children().length,
						settings: settings,
						busy: false,
						hash: '',
						touchStart: 0,
						touchEnd: 0
					});
					
					//keyboard ctrls
					$(window).bind('keyup.presentation', function(event){
						if(event.keyCode == 37){
							methods.prev.call($this);
						}else if(event.keyCode == 39){
							methods.next.call($this);
						}
					}); 
					
					//add pager nav
					var pager = $('<ul class="pager"></ul>').appendTo('body');					
					
					//setup slides
					$this.children().each(function(i){
						$(this).addClass('slide');
						if(i != $this.data('presentation').current){
							$(this).css('top','-100%').hide();
						}
						pager.append('<li><a href="#">'+(i+1)+'</a></li>');
					});
					
					//pager link click handler
					$('.pager a').bind('click.presentation', function(){
						var pagerNum = parseInt($(this).text())-1;
						methods.goto.call($this, pagerNum);
						return false;
					});
					
					//hash ctrls
					methods.setupHash.call($this)
					//clearInterval(h);
					var h = setInterval(function(){methods.pollHash.call($this)}, 250);	
					
					$this.swipe({
						swipeLeft:function(){methods.prev.call($this);},
						threshold:0
					}).swipe({
						swipeRight:function(){methods.next.call($this);},
						threshold:0
					});
									
				}
			});				
		},
		destroy: function() {
			return this.each(function(){
				var $this = $(this), data = $this.data('presentation');				
				$(window).unbind('.presentation');
				 $this.removeData('presentation');				
			})	
		},
		next: function(){
			var $this = $(this), data = $this.data('presentation');
			
			methods.goto.call($this, data.current+1);

		},
		prev: function(){
			var $this = $(this), data = $this.data('presentation');
			methods.goto.call($this, data.current-1);
		},
		goto: function(num){
			var $this = $(this), data = $this.data('presentation');
			if(num >= 0 && num <= data.total-1 && !data.busy){		
				data.busy = true;				
				$('.pager a').removeClass('current');
				$('.pager a:eq('+num+')').addClass('current');				
				$this.children(':eq('+data.current+')').animate({'top':'-100%','opacity':0}, data.settings.duration, data.settings.easing, function(){					
					$this.children(':eq('+num+')').css({'top':'0'}).fadeTo('slow', 1, function(){
						data.current = num;
						methods.updateHash(num+1);
						data.busy = false;
					});
				});	
			}
		},		
		setupHash: function(){
			var $this = $(this), 
			    data = $this.data('presentation'),
			    hash = methods.getHashNum();
				
			if(!isNaN(hash) && hash <= data.total-1 && hash >= 0 && hash != ''){
				data.current = hash;
			}else{
				methods.updateHash(data.current+1);
			}
			data.hash = hash;
		},
		pollHash: function(){
			var $this = $(this), 
			    data = $this.data('presentation'),
			    hash = methods.getHashNum();
				
			//check page num
			if(!isNaN(hash) && hash <= data.total-1 && hash >= 0){
				if(hash != data.current && hash.toString()!=data.hash){		
					if(!data.busy){
						data.hash = hash;						
						methods.goto.call($this, hash);
					}
				}
			}
		},
		getHashNum: function(){
			//get page number from hash tag, last element
			var hash = window.location.hash.split('/');
			if(hash.length > 1){
				return parseInt(hash[2])-1;
			}else{
				return '';
			}
		},
		updateHash: function(hash){
			window.location.hash = "/slide/" + hash;
		}
	}
			
})(jQuery);