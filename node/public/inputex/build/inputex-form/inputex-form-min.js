YUI.add("inputex-form",function(c){var b=c.Lang,a=c.inputEx;a.Form=function(d){a.Form.superclass.constructor.call(this,d)};c.extend(a.Form,a.Group,{setOptions:function(d){a.Form.superclass.setOptions.call(this,d);this.buttons=[];this.options.buttons=d.buttons||[];this.options.action=d.action;this.options.method=d.method;this.options.className=d.className||"inputEx-Group";this.options.autocomplete=b.isUndefined(d.autocomplete)?a.browserAutocomplete:(d.autocomplete===false||d.autocomplete==="off")?false:true;this.options.enctype=d.enctype;if(d.ajax){this.options.ajax={};this.options.ajax.method=d.ajax.method||"POST";this.options.ajax.uri=d.ajax.uri||"default.php";this.options.ajax.callback=d.ajax.callback||{};this.options.ajax.callback.scope=(d.ajax.callback&&d.ajax.callback.scope)||this;this.options.ajax.showMask=b.isUndefined(d.ajax.showMask)?false:d.ajax.showMask;this.options.ajax.contentType=d.ajax.contentType||"application/json";this.options.ajax.wrapObject=d.ajax.wrapObject}if(b.isFunction(d.onSubmit)){this.options.onSubmit=d.onSubmit}},render:function(){this.divEl=a.cn("div",{className:this.options.className});if(this.options.id){this.divEl.id=this.options.id}this.form=a.cn("form",{method:this.options.method||"POST",action:this.options.action||"",className:this.options.className||"inputEx-Form"});this.divEl.appendChild(this.form);if(this.options.enctype){this.form.setAttribute("enctype",this.options.enctype)}this.form.setAttribute("autocomplete",this.options.autocomplete?"on":"off");if(this.options.formName){this.form.name=this.options.formName}this.renderFields(this.form);this.renderButtons();if(this.options.disabled){this.disable()}},renderButtons:function(){var d,g,f,e=this.options.buttons.length;this.buttonDiv=a.cn("div",{className:"inputEx-Form-buttonBar"});for(f=0;f<e;f++){d=this.options.buttons[f];if(!d){throw new Error("inputEx.Form: One of the provided button is undefined ! (check trailing comma)")}g=new a.widget.Button(d);g.render(this.buttonDiv);this.buttons.push(g)}this.buttonDiv.appendChild(a.cn("div",null,{clear:"both"}));this.form.appendChild(this.buttonDiv)},initEvents:function(){var d,e;a.Form.superclass.initEvents.call(this);this.publish("submit");this.publish("afterValidation");c.on("submit",function(f){f.halt();this.fire("submit")},this.form,this);for(d=0,e=this.buttons.length;d<e;d++){this.buttons[d].on("submit",function(){this.fire("submit")},this)}this.on("submit",this.options.onSubmit||this.onSubmit,this)},onSubmit:function(d){if(!this.validate()){return}this.fire("afterValidation");if(this.options.ajax){this.asyncRequest();return}this.form.submit()},asyncRequest:function(){if(this.options.ajax.showMask){this.showMask()}var n=this.getValue();var h=b.isFunction(this.options.ajax.uri)?this.options.ajax.uri(n):this.options.ajax.uri;var d=b.isFunction(this.options.ajax.method)?this.options.ajax.method(n):this.options.ajax.method;var f=null;if(this.options.ajax.contentType=="application/x-www-form-urlencoded"&&d!="PUT"){var j=[];for(var m in n){if(n.hasOwnProperty(m)){var l=(this.options.ajax.wrapObject?this.options.ajax.wrapObject+"[":"")+m+(this.options.ajax.wrapObject?"]":"");j.push(l+"="+window.encodeURIComponent(n[m]))}}f=j.join("&")}else{c.io.header("Content-Type","application/json");if(d=="PUT"){var i=this.getValue();var e;if(this.options.ajax.wrapObject){e={};e[this.options.ajax.wrapObject]=i}else{e=i}f=c.JSON.stringify(e)}else{f="value="+window.encodeURIComponent(c.JSON.stringify(this.getValue()))}}var k=function(p){if(this.options.ajax.showMask){this.hideMask()}if(b.isFunction(this.options.ajax.callback.success)){this.options.ajax.callback.success.call(this.options.ajax.callback.scope,p)}};var g=function(p){if(this.options.ajax.showMask){this.hideMask()}if(b.isFunction(this.options.ajax.callback.failure)){this.options.ajax.callback.failure.call(this.options.ajax.callback.scope,p)}};c.io(h,{method:d,data:f,on:{success:k,failure:g},context:this})},renderMask:function(){if(this.maskRendered){return}c.one(this.divEl).setStyle("position","relative");if(c.UA.ie>0){c.one(this.divEl).setStyle("zoom",1)}this.formMask=a.cn("div",{className:"inputEx-Form-Mask"},{display:"none",width:this.divEl.offsetWidth+"px",height:this.divEl.offsetHeight+"px"},"<div class='inputEx-Form-Mask-bg'/><center><br/><div class='inputEx-Form-Mask-spinner'></div><br /><span>"+a.messages.ajaxWait+"</span></div>");this.divEl.appendChild(this.formMask);this.maskRendered=true},showMask:function(){this.renderMask();this.toggleSelectsInIE(false);this.formMask.style.display=""},hideMask:function(){this.toggleSelectsInIE(true);this.formMask.style.display="none"},toggleSelectsInIE:function(d){if(!!c.UA.ie&&c.UA.ie<7){var e=!!d?"removeClass":"addClass";var f=this;c.one(this.divEl).all("select").each(function(g){g[e]("inputEx-hidden")})}},enable:function(){a.Form.superclass.enable.call(this);for(var d=0;d<this.buttons.length;d++){this.buttons[d].enable()}},disable:function(){a.Form.superclass.disable.call(this);for(var d=0;d<this.buttons.length;d++){this.buttons[d].disable()}},destroy:function(){var e,f,d;c.Event.purgeElement(this.form);for(e=0,f=this.buttons.length;e<f;e++){d=this.buttons[e];d.destroy()}a.Form.superclass.destroy.call(this)}});a.registerType("form",a.Form,[{type:"list",label:"Buttons",name:"buttons",elementType:{type:"group",fields:[{label:"Label",name:"value"},{type:"select",label:"Type",name:"type",choices:[{value:"button"},{value:"submit"}]}]}}])},"3.0.0a",{requires:["io-base","inputex-group","json","inputex-button"]});