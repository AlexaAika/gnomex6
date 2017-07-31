/*
jQWidgets v4.5.4 (2017-June)
Copyright (c) 2011-2017 jQWidgets.
License: http://jqwidgets.com/license/
*/
!function(a){a.jqx.jqxWidget("jqxLoader","",{}),a.extend(a.jqx._jqxLoader.prototype,{defineInstance:function(){var b={width:200,height:150,text:"Loading...",html:null,textPosition:"bottom",imagePosition:"center",isModal:!1,autoOpen:!1,rtl:!1,events:["create"]};return this===a.jqx._jqxLoader.prototype?b:(a.extend(!0,this,b),b)},createInstance:function(a){var b=this;b._render(!0),b._raiseEvent("0")},render:function(){this._render()},open:function(a,b){var c=this;null!==this.width&&-1!==this.width.toString().indexOf("%")&&c.host.css("width",this.width),null!==this.height&&-1!==this.height.toString().indexOf("%")&&c.host.css("height",this.height),c.host.show(),c.host.css("left",-c.host.width()/2),c.host.css("top",-c.host.height()/2),a&&b&&(c.host.css("left",a),c.host.css("top",b)),c.isModal&&c._modal.show()},close:function(){var a=this;a.host.hide(),a.isModal&&a._modal.hide()},_checkBrowser:function(){var b=this;"msie"===a.jqx.browser.browser&&("7.0"===a.jqx.browser.version?(!1===b.isModal&&b.host.addClass(b.toThemeProperty("jqx-loader-ie-transparency")),b.host.css("top",Math.max(0,(a(window).height()-a(b.host).outerHeight())/2+a(window).scrollTop())+"px"),b.host.css("left",Math.max(0,(a(window).width()-a(b.host).outerWidth())/2+a(window).scrollLeft())+"px"),a(window).resize(function(){b.host.css("top",Math.max(0,(a(window).height()-a(b.host).outerHeight())/2+a(window).scrollTop())+"px"),b.host.css("left",Math.max(0,(a(window).width()-a(b.host).outerWidth())/2+a(window).scrollLeft())+"px")}),this.host.css({"margin-top":"0","margin-left":"0"})):"8.0"===a.jqx.browser.version&&!1===b.isModal&&b.host.addClass(b.toThemeProperty("jqx-loader-ie-transparency")))},_textPos:function(){var a=this;this._text=a.host.children("div:eq(1)"),this._image&&this._image.css("background-position-y",a.imagePosition),"top"===a.textPosition?(this._text.addClass(a.toThemeProperty("jqx-loader-text-top")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-bottom")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-left")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-right"))):"bottom"===a.textPosition?(this._text.addClass(a.toThemeProperty("jqx-loader-text-bottom")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-top")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-left")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-right"))):"left"===a.textPosition?(this._text.addClass(a.toThemeProperty("jqx-loader-text-left")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-right")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-top")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-bottom"))):"right"===a.textPosition&&(this._text.addClass(a.toThemeProperty("jqx-loader-text-right")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-left")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-top")),this._text.removeClass(a.toThemeProperty("jqx-loader-text-bottom")))},refresh:function(a){!0!==a&&this._render(!1)},destroy:function(){var a=this;a._removeHandlers(),a.host.remove()},propertyChangedHandler:function(a,b,c,d){if(d!==c)switch(b){case"width":a.host.width(d);break;case"height":a.host.height(d);break;case"text":a._text.text(d);break;case"html":a.host.html(d);break;case"textPosition":a._textPos(d);break;case"rtl":!0===d?a._text.addClass(a.toThemeProperty("jqx-loader-rtl")):a._text.removeClass(a.toThemeProperty("jqx-loader-rtl"))}},_raiseEvent:function(b,c){var d=this,e=d.events[b],f=new a.Event(e);f.owner=d,f.args=c;try{var g=d.host.trigger(f)}catch(a){}return g},_render:function(b){var c=this;if(c.host.width(c.width),c.host.height(c.height),!1===c.autoOpen&&c.host.hide(),b&&(null===c.html?(c.host.append('<div class="'+c.toThemeProperty("jqx-loader-icon")+'"></div><div class="'+c.toThemeProperty("jqx-loader-text")+'">'+c.text+"</div>"),c._image=c.host.children("div:eq(0)"),c._text=c.host.children("div:eq(1)")):c.host.html(this.html),!0===c.isModal)){var d=c.host.css("display");c._modal=a('<div id="'+c.element.id+'Modal" class="'+c.toThemeProperty("jqx-loader-modal")+'" style="display: '+d+';"></div>'),a("body").append(c._modal)}c._checkBrowser(),c._textPos(),c._addClass(),c._removeHandlers(),c._addHandlers()},_addHandlers:function(){var b=this;!0===b.isModal&&b.addHandler(a(document),"keyup.loader"+b.element.id,function(a){27===a.keyCode&&b.close()})},_removeHandlers:function(){var b=this;b.removeHandler(a(document),"keyup.loader"+b.element.id)},_addClass:function(){var b=this;b.host.addClass(b.toThemeProperty("jqx-widget")),b.host.addClass(b.toThemeProperty("jqx-loader")),b.host.addClass(b.toThemeProperty("jqx-rc-all")),b.host.addClass(b.toThemeProperty("jqx-fill-state-normal")),b.rtl&&b._text.addClass(b.toThemeProperty("jqx-loader-rtl")),a.jqx.browser.msie&&b.host.addClass(this.toThemeProperty("jqx-noshadow")),b.host.addClass(this.toThemeProperty("jqx-rc-t")),b.host.addClass(this.toThemeProperty("jqx-rc-b")),b.host.addClass(this.toThemeProperty("jqx-popup"))}})}(jqxBaseFramework);

