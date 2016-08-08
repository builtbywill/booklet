/* Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * $LastChangedDate: 2007-06-20 03:23:36 +0200 (Mi, 20 Jun 2007) $
 * $Rev: 2110 $
 *
 * Version 2.1
 */

(function($){$.fn.bgIframe=$.fn.bgiframe=function(s){if($.browser.msie&&parseInt($.browser.version)<=6){s=$.extend({top:'auto',left:'auto',width:'auto',height:'auto',opacity:true,src:'javascript:false;'},s||{});var a=function(n){return n&&n.constructor==Number?n+'px':n},html='<iframe class="bgiframe"frameborder="0"tabindex="-1"src="'+s.src+'"'+'style="display:block;position:absolute;z-index:-1;'+(s.opacity!==false?'filter:Alpha(Opacity=\'0\');':'')+'top:'+(s.top=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')':a(s.top))+';'+'left:'+(s.left=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')':a(s.left))+';'+'width:'+(s.width=='auto'?'expression(this.parentNode.offsetWidth+\'px\')':a(s.width))+';'+'height:'+(s.height=='auto'?'expression(this.parentNode.offsetHeight+\'px\')':a(s.height))+';'+'"/>';return this.each(function(){if($('> iframe.bgiframe',this).length==0)this.insertBefore(document.createElement(html),this.firstChild)})}return this};if(!$.browser.version)$.browser.version=navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)[1]})(jQuery);

/*
 * jQuery Form Plugin
 * version: 2.17 (06-NOV-2008)
 * @requires jQuery v1.2.2 or later
 *
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Revision: $Id$
 */
;(function($){$.fn.ajaxSubmit=function(u){if(!this.length){log('ajaxSubmit: skipping submit process - no element selected');return this}if(typeof u=='function')u={success:u};u=$.extend({url:this.attr('action')||window.location.toString(),type:this.attr('method')||'GET'},u||{});var v={};this.trigger('form-pre-serialize',[this,u,v]);if(v.veto){log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');return this}if(u.beforeSerialize&&u.beforeSerialize(this,u)===false){log('ajaxSubmit: submit aborted via beforeSerialize callback');return this}var a=this.formToArray(u.semantic);if(u.data){u.extraData=u.data;for(var n in u.data){if(u.data[n]instanceof Array){for(var k in u.data[n])a.push({name:n,value:u.data[n][k]})}else a.push({name:n,value:u.data[n]})}}if(u.beforeSubmit&&u.beforeSubmit(a,this,u)===false){log('ajaxSubmit: submit aborted via beforeSubmit callback');return this}this.trigger('form-submit-validate',[a,this,u,v]);if(v.veto){log('ajaxSubmit: submit vetoed via form-submit-validate trigger');return this}var q=$.param(a);if(u.type.toUpperCase()=='GET'){u.url+=(u.url.indexOf('?')>=0?'&':'?')+q;u.data=null}else u.data=q;var w=this,callbacks=[];if(u.resetForm)callbacks.push(function(){w.resetForm()});if(u.clearForm)callbacks.push(function(){w.clearForm()});if(!u.dataType&&u.target){var x=u.success||function(){};callbacks.push(function(a){$(u.target).html(a).each(x,arguments)})}else if(u.success)callbacks.push(u.success);u.success=function(a,b){for(var i=0,max=callbacks.length;i<max;i++)callbacks[i].apply(u,[a,b,w])};var y=$('input:file',this).fieldValue();var z=false;for(var j=0;j<y.length;j++)if(y[j])z=true;if(u.iframe||z){if($.browser.safari&&u.closeKeepAlive)$.get(u.closeKeepAlive,fileUpload);else fileUpload()}else $.ajax(u);this.trigger('form-submit-notify',[this,u]);return this;function fileUpload(){var i=w[0];if($(':input[@name=submit]',i).length){alert('Error: Form elements must not be named "submit".');return}var j=$.extend({},$.ajaxSettings,u);var s=jQuery.extend(true,{},$.extend(true,{},$.ajaxSettings),j);var k='jqFormIO'+(new Date().getTime());var l=$('<iframe id="'+k+'" name="'+k+'" />');var m=l[0];if($.browser.msie||$.browser.opera)m.src='javascript:false;document.write("");';l.css({position:'absolute',top:'-1000px',left:'-1000px'});var o={aborted:0,responseText:null,responseXML:null,status:0,statusText:'n/a',getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(){this.aborted=1;l.attr('src','about:blank')}};var g=j.global;if(g&&!$.active++)$.event.trigger("ajaxStart");if(g)$.event.trigger("ajaxSend",[o,j]);if(s.beforeSend&&s.beforeSend(o,s)===false){s.global&&jQuery.active--;return}if(o.aborted)return;var p=0;var q=0;var r=i.clk;if(r){var n=r.name;if(n&&!r.disabled){u.extraData=u.extraData||{};u.extraData[n]=r.value;if(r.type=="image"){u.extraData[name+'.x']=i.clk_x;u.extraData[name+'.y']=i.clk_y}}}setTimeout(function(){var t=w.attr('target'),a=w.attr('action');w.attr({target:k,method:'POST',action:j.url});if(!u.skipEncodingOverride){w.attr({encoding:'multipart/form-data',enctype:'multipart/form-data'})}if(j.timeout)setTimeout(function(){q=true;cb()},j.timeout);var b=[];try{if(u.extraData)for(var n in u.extraData)b.push($('<input type="hidden" name="'+n+'" value="'+u.extraData[n]+'" />').appendTo(i)[0]);l.appendTo('body');m.attachEvent?m.attachEvent('onload',cb):m.addEventListener('load',cb,false);i.submit()}finally{w.attr('action',a);t?w.attr('target',t):w.removeAttr('target');$(b).remove()}},10);function cb(){if(p++)return;m.detachEvent?m.detachEvent('onload',cb):m.removeEventListener('load',cb,false);var c=0;var d=true;try{if(q)throw'timeout';var f,doc;doc=m.contentWindow?m.contentWindow.document:m.contentDocument?m.contentDocument:m.document;if(doc.body==null&&!c&&$.browser.opera){c=1;p--;setTimeout(cb,100);return}o.responseText=doc.body?doc.body.innerHTML:null;o.responseXML=doc.XMLDocument?doc.XMLDocument:doc;o.getResponseHeader=function(a){var b={'content-type':j.dataType};return b[a]};if(j.dataType=='json'||j.dataType=='script'){var h=doc.getElementsByTagName('textarea')[0];o.responseText=h?h.value:o.responseText}else if(j.dataType=='xml'&&!o.responseXML&&o.responseText!=null){o.responseXML=toXml(o.responseText)}f=$.httpData(o,j.dataType)}catch(e){d=false;$.handleError(j,o,'error',e)}if(d){j.success(f,'success');if(g)$.event.trigger("ajaxSuccess",[o,j])}if(g)$.event.trigger("ajaxComplete",[o,j]);if(g&&!--$.active)$.event.trigger("ajaxStop");if(j.complete)j.complete(o,d?'success':'error');setTimeout(function(){l.remove();o.responseXML=null},100)};function toXml(s,a){if(window.ActiveXObject){a=new ActiveXObject('Microsoft.XMLDOM');a.async='false';a.loadXML(s)}else a=(new DOMParser()).parseFromString(s,'text/xml');return(a&&a.documentElement&&a.documentElement.tagName!='parsererror')?a:null}}};$.fn.ajaxForm=function(c){return this.ajaxFormUnbind().bind('submit.form-plugin',function(){$(this).ajaxSubmit(c);return false}).each(function(){$(":submit,input:image",this).bind('click.form-plugin',function(e){var a=this.form;a.clk=this;if(this.type=='image'){if(e.offsetX!=undefined){a.clk_x=e.offsetX;a.clk_y=e.offsetY}else if(typeof $.fn.offset=='function'){var b=$(this).offset();a.clk_x=e.pageX-b.left;a.clk_y=e.pageY-b.top}else{a.clk_x=e.pageX-this.offsetLeft;a.clk_y=e.pageY-this.offsetTop}}setTimeout(function(){a.clk=a.clk_x=a.clk_y=null},10)})})};$.fn.ajaxFormUnbind=function(){this.unbind('submit.form-plugin');return this.each(function(){$(":submit,input:image",this).unbind('click.form-plugin')})};$.fn.formToArray=function(b){var a=[];if(this.length==0)return a;var c=this[0];var d=b?c.getElementsByTagName('*'):c.elements;if(!d)return a;for(var i=0,max=d.length;i<max;i++){var e=d[i];var n=e.name;if(!n)continue;if(b&&c.clk&&e.type=="image"){if(!e.disabled&&c.clk==e)a.push({name:n+'.x',value:c.clk_x},{name:n+'.y',value:c.clk_y});continue}var v=$.fieldValue(e,true);if(v&&v.constructor==Array){for(var j=0,jmax=v.length;j<jmax;j++)a.push({name:n,value:v[j]})}else if(v!==null&&typeof v!='undefined')a.push({name:n,value:v})}if(!b&&c.clk){var f=c.getElementsByTagName("input");for(var i=0,max=f.length;i<max;i++){var g=f[i];var n=g.name;if(n&&!g.disabled&&g.type=="image"&&c.clk==g)a.push({name:n+'.x',value:c.clk_x},{name:n+'.y',value:c.clk_y})}}return a};$.fn.formSerialize=function(a){return $.param(this.formToArray(a))};$.fn.fieldSerialize=function(b){var a=[];this.each(function(){var n=this.name;if(!n)return;var v=$.fieldValue(this,b);if(v&&v.constructor==Array){for(var i=0,max=v.length;i<max;i++)a.push({name:n,value:v[i]})}else if(v!==null&&typeof v!='undefined')a.push({name:this.name,value:v})});return $.param(a)};$.fn.fieldValue=function(a){for(var b=[],i=0,max=this.length;i<max;i++){var c=this[i];var v=$.fieldValue(c,a);if(v===null||typeof v=='undefined'||(v.constructor==Array&&!v.length))continue;v.constructor==Array?$.merge(b,v):b.push(v)}return b};$.fieldValue=function(b,c){var n=b.name,t=b.type,tag=b.tagName.toLowerCase();if(typeof c=='undefined')c=true;if(c&&(!n||b.disabled||t=='reset'||t=='button'||(t=='checkbox'||t=='radio')&&!b.checked||(t=='submit'||t=='image')&&b.form&&b.form.clk!=b||tag=='select'&&b.selectedIndex==-1))return null;if(tag=='select'){var d=b.selectedIndex;if(d<0)return null;var a=[],ops=b.options;var e=(t=='select-one');var f=(e?d+1:ops.length);for(var i=(e?d:0);i<f;i++){var g=ops[i];if(g.selected){var v=$.browser.msie&&!(g.attributes['value'].specified)?g.text:g.value;if(e)return v;a.push(v)}}return a}return b.value};$.fn.clearForm=function(){return this.each(function(){$('input,select,textarea',this).clearFields()})};$.fn.clearFields=$.fn.clearInputs=function(){return this.each(function(){var t=this.type,tag=this.tagName.toLowerCase();if(t=='text'||t=='password'||tag=='textarea')this.value='';else if(t=='checkbox'||t=='radio')this.checked=false;else if(tag=='select')this.selectedIndex=-1})};$.fn.resetForm=function(){return this.each(function(){if(typeof this.reset=='function'||(typeof this.reset=='object'&&!this.reset.nodeType))this.reset()})};$.fn.enable=function(b){if(b==undefined)b=true;return this.each(function(){this.disabled=!b})};$.fn.selected=function(b){if(b==undefined)b=true;return this.each(function(){var t=this.type;if(t=='checkbox'||t=='radio')this.checked=b;else if(this.tagName.toLowerCase()=='option'){var a=$(this).parent('select');if(b&&a[0]&&a[0].type=='select-one'){a.find('option').selected(false)}this.selected=b}})};function log(){if($.fn.ajaxSubmit.debug&&window.console&&window.console.log)window.console.log('[jquery.form] '+Array.prototype.join.call(arguments,''))}})(jQuery);

/**
 * jQuery.ScrollTo - Easy element scrolling using jQuery.
 * Copyright (c) 2007-2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 9/11/2008
 * @author Ariel Flesler
 * @version 1.4
 *
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 */
;(function(h){var m=h.scrollTo=function(b,c,g){h(window).scrollTo(b,c,g)};m.defaults={axis:'y',duration:1};m.window=function(b){return h(window).scrollable()};h.fn.scrollable=function(){return this.map(function(){var b=this.parentWindow||this.defaultView,c=this.nodeName=='#document'?b.frameElement||b:this,g=c.contentDocument||(c.contentWindow||c).document,i=c.setInterval;return c.nodeName=='IFRAME'||i&&h.browser.safari?g.body:i?g.documentElement:this})};h.fn.scrollTo=function(r,j,a){if(typeof j=='object'){a=j;j=0}if(typeof a=='function')a={onAfter:a};a=h.extend({},m.defaults,a);j=j||a.speed||a.duration;a.queue=a.queue&&a.axis.length>1;if(a.queue)j/=2;a.offset=n(a.offset);a.over=n(a.over);return this.scrollable().each(function(){var k=this,o=h(k),d=r,l,e={},p=o.is('html,body');switch(typeof d){case'number':case'string':if(/^([+-]=)?\d+(px)?$/.test(d)){d=n(d);break}d=h(d,this);case'object':if(d.is||d.style)l=(d=h(d)).offset()}h.each(a.axis.split(''),function(b,c){var g=c=='x'?'Left':'Top',i=g.toLowerCase(),f='scroll'+g,s=k[f],t=c=='x'?'Width':'Height',v=t.toLowerCase();if(l){e[f]=l[i]+(p?0:s-o.offset()[i]);if(a.margin){e[f]-=parseInt(d.css('margin'+g))||0;e[f]-=parseInt(d.css('border'+g+'Width'))||0}e[f]+=a.offset[i]||0;if(a.over[i])e[f]+=d[v]()*a.over[i]}else e[f]=d[i];if(/^\d+$/.test(e[f]))e[f]=e[f]<=0?0:Math.min(e[f],u(t));if(!b&&a.queue){if(s!=e[f])q(a.onAfterFirst);delete e[f]}});q(a.onAfter);function q(b){o.animate(e,j,a.easing,b&&function(){b.call(this,r,a)})};function u(b){var c='scroll'+b,g=k.ownerDocument;return p?Math.max(g.documentElement[c],g.body[c]):k[c]}}).end()};function n(b){return typeof b=='object'?b:{top:b,left:b}}})(jQuery);

/**
 * jQuery.LocalScroll - Animated scrolling navigation, using anchors.
 * Copyright (c) 2007-2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 6/3/2008
 * @author Ariel Flesler
 * @version 1.2.6
 **/
;(function($){var g=location.href.replace(/#.*/,''),h=$.localScroll=function(a){$('body').localScroll(a)};h.defaults={duration:1e3,axis:'y',event:'click',stop:1};h.hash=function(a){a=$.extend({},h.defaults,a);a.hash=0;if(location.hash)setTimeout(function(){i(0,location,a)},0)};$.fn.localScroll=function(b){b=$.extend({},h.defaults,b);return(b.persistent||b.lazy)?this.bind(b.event,function(e){var a=$([e.target,e.target.parentNode]).filter(c)[0];a&&i(e,a,b)}):this.find('a,area').filter(c).bind(b.event,function(e){i(e,this,b)}).end().end();function c(){var a=this;return!!a.href&&!!a.hash&&a.href.replace(a.hash,'')==g&&(!b.filter||$(a).is(b.filter))}};function i(e,a,b){var c=a.hash.slice(1),d=document.getElementById(c)||document.getElementsByName(c)[0],f;if(d){e&&e.preventDefault();f=$(b.target||$.scrollTo.window());if(b.lock&&f.is(':animated')||b.onBefore&&b.onBefore.call(a,e,d,f)===!1)return;if(b.stop)f.queue('fx',[]).stop();f.scrollTo(d,b).trigger('notify.serialScroll',[d]);if(b.hash)f.queue(function(){location=a.hash;$(this).dequeue()})}}})(jQuery);

/**
 * jQuery[a] - Animated scrolling of series
 * Copyright (c) 2007-2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 3/20/2008
 * @author Ariel Flesler
 * @version 1.2.1
 *
 * http://flesler.blogspot.com/2008/02/jqueryserialscroll.html
 */
;(function($){var a='serialScroll',b='.'+a,c='bind',C=$[a]=function(b){$.scrollTo.window()[a](b)};C.defaults={duration:1e3,axis:'x',event:'click',start:0,step:1,lock:1,cycle:1,constant:1};$.fn[a]=function(y){y=$.extend({},C.defaults,y);var z=y.event,A=y.step,B=y.lazy;return this.each(function(){var j=y.target?this:document,k=$(y.target||this,j),l=k[0],m=y.items,o=y.start,p=y.interval,q=y.navigation,r;if(!B)m=w();if(y.force)t({},o);$(y.prev||[],j)[c](z,-A,s);$(y.next||[],j)[c](z,A,s);if(!l.ssbound)k[c]('prev'+b,-A,s)[c]('next'+b,A,s)[c]('goto'+b,t);if(p)k[c]('start'+b,function(e){if(!p){v();p=1;u()}})[c]('stop'+b,function(){v();p=0});k[c]('notify'+b,function(e,a){var i=x(a);if(i>-1)o=i});l.ssbound=1;if(y.jump)(B?k:w())[c](z,function(e){t(e,x(e.target))});if(q)q=$(q,j)[c](z,function(e){e.data=Math.round(w().length/q.length)*q.index(this);t(e,this)});function s(e){e.data+=o;t(e,this)};function t(e,a){if(!isNaN(a)){e.data=a;a=l}var c=e.data,n,d=e.type,f=y.exclude?w().slice(0,-y.exclude):w(),g=f.length,h=f[c],i=y.duration;if(d)e.preventDefault();if(p){v();r=setTimeout(u,y.interval)}if(!h){n=c<0?0:n=g-1;if(o!=n)c=n;else if(!y.cycle)return;else c=g-n-1;h=f[c]}if(!h||d&&o==c||y.lock&&k.is(':animated')||d&&y.onBefore&&y.onBefore.call(a,e,h,k,w(),c)===!1)return;if(y.stop)k.queue('fx',[]).stop();if(y.constant)i=Math.abs(i/A*(o-c));k.scrollTo(h,i,y).trigger('notify'+b,[c])};function u(){k.trigger('next'+b)};function v(){clearTimeout(r)};function w(){return $(m,l)};function x(a){if(!isNaN(a))return a;var b=w(),i;while((i=b.index(a))==-1&&a!=l)a=a.parentNode;return i}})}})(jQuery);

/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

jQuery.easing['jswing']=jQuery.easing['swing'];jQuery.extend(jQuery.easing,{def:'easeOutQuad',swing:function(x,t,b,c,d){return jQuery.easing[jQuery.easing.def](x,t,b,c,d)},easeInQuad:function(x,t,b,c,d){return c*(t/=d)*t+b},easeOutQuad:function(x,t,b,c,d){return-c*(t/=d)*(t-2)+b},easeInOutQuad:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t+b;return-c/2*((--t)*(t-2)-1)+b},easeInCubic:function(x,t,b,c,d){return c*(t/=d)*t*t+b},easeOutCubic:function(x,t,b,c,d){return c*((t=t/d-1)*t*t+1)+b},easeInOutCubic:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t+b;return c/2*((t-=2)*t*t+2)+b},easeInQuart:function(x,t,b,c,d){return c*(t/=d)*t*t*t+b},easeOutQuart:function(x,t,b,c,d){return-c*((t=t/d-1)*t*t*t-1)+b},easeInOutQuart:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t*t+b;return-c/2*((t-=2)*t*t*t-2)+b},easeInQuint:function(x,t,b,c,d){return c*(t/=d)*t*t*t*t+b},easeOutQuint:function(x,t,b,c,d){return c*((t=t/d-1)*t*t*t*t+1)+b},easeInOutQuint:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t*t*t+b;return c/2*((t-=2)*t*t*t*t+2)+b},easeInSine:function(x,t,b,c,d){return-c*Math.cos(t/d*(Math.PI/2))+c+b},easeOutSine:function(x,t,b,c,d){return c*Math.sin(t/d*(Math.PI/2))+b},easeInOutSine:function(x,t,b,c,d){return-c/2*(Math.cos(Math.PI*t/d)-1)+b},easeInExpo:function(x,t,b,c,d){return(t==0)?b:c*Math.pow(2,10*(t/d-1))+b},easeOutExpo:function(x,t,b,c,d){return(t==d)?b+c:c*(-Math.pow(2,-10*t/d)+1)+b},easeInOutExpo:function(x,t,b,c,d){if(t==0)return b;if(t==d)return b+c;if((t/=d/2)<1)return c/2*Math.pow(2,10*(t-1))+b;return c/2*(-Math.pow(2,-10*--t)+2)+b},easeInCirc:function(x,t,b,c,d){return-c*(Math.sqrt(1-(t/=d)*t)-1)+b},easeOutCirc:function(x,t,b,c,d){return c*Math.sqrt(1-(t=t/d-1)*t)+b},easeInOutCirc:function(x,t,b,c,d){if((t/=d/2)<1)return-c/2*(Math.sqrt(1-t*t)-1)+b;return c/2*(Math.sqrt(1-(t-=2)*t)+1)+b},easeInElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d)==1)return b+c;if(!p)p=d*.3;if(a<Math.abs(c)){a=c;var s=p/4}else var s=p/(2*Math.PI)*Math.asin(c/a);return-(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b},easeOutElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d)==1)return b+c;if(!p)p=d*.3;if(a<Math.abs(c)){a=c;var s=p/4}else var s=p/(2*Math.PI)*Math.asin(c/a);return a*Math.pow(2,-10*t)*Math.sin((t*d-s)*(2*Math.PI)/p)+c+b},easeInOutElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d/2)==2)return b+c;if(!p)p=d*(.3*1.5);if(a<Math.abs(c)){a=c;var s=p/4}else var s=p/(2*Math.PI)*Math.asin(c/a);if(t<1)return-.5*(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;return a*Math.pow(2,-10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p)*.5+c+b},easeInBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;return c*(t/=d)*t*((s+1)*t-s)+b},easeOutBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;return c*((t=t/d-1)*t*((s+1)*t+s)+1)+b},easeInOutBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;if((t/=d/2)<1)return c/2*(t*t*(((s*=(1.525))+1)*t-s))+b;return c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b},easeInBounce:function(x,t,b,c,d){return c-jQuery.easing.easeOutBounce(x,d-t,0,c,d)+b},easeOutBounce:function(x,t,b,c,d){if((t/=d)<(1/2.75)){return c*(7.5625*t*t)+b}else if(t<(2/2.75)){return c*(7.5625*(t-=(1.5/2.75))*t+.75)+b}else if(t<(2.5/2.75)){return c*(7.5625*(t-=(2.25/2.75))*t+.9375)+b}else{return c*(7.5625*(t-=(2.625/2.75))*t+.984375)+b}},easeInOutBounce:function(x,t,b,c,d){if(t<d/2)return jQuery.easing.easeInBounce(x,t*2,0,c,d)*.5+b;return jQuery.easing.easeOutBounce(x,t*2-d,0,c,d)*.5+c*.5+b}});


/*
 * jQuery fieldnames
 * Copyright (c) 2009-2010 W. Grauvogel
 */
;(function($) {
		   
$.fn.fieldnames = function(options) {
	return this.each(function() {
							  
		//initialize options
		var opts = $.extend({}, $.fn.fieldnames.defaults, options);
		
		//get title attr														
		var $title = $(this).attr('title');
		
		//if value is empty, set value to title
		if($(this).val() == "" || $(this).val() == $title) $(this).val($title);
		
		//set focus and blur events
		$(this).focus(function(){
			//if val equals title, empty and set focus color				   
			if($(this).val() == $title) $(this).val("");
		}).blur(function(){
			//if val is empty, reset color and value		   
			if($(this).val() == "")
				$(this).val($title);
		});
		
	});
}
})(jQuery);