YUI.add("inputex-rte",function(d){var a=d.inputEx,b=d.YUI2,c=d.Lang;a.RTEField=function(e){a.RTEField.superclass.constructor.call(this,e)};d.extend(a.RTEField,a.Field,{setOptions:function(e){a.RTEField.superclass.setOptions.call(this,e);this.options.opts=e.opts||{};this.options.editorType=e.editorType},renderComponent:function(){if(!a.RTEfieldsNumber){a.RTEfieldsNumber=0}var k="inputEx-RTEField-"+a.RTEfieldsNumber;var f={id:k};if(this.options.name){f.name=this.options.name}this.el=a.cn("textarea",f);a.RTEfieldsNumber+=1;this.fieldContainer.appendChild(this.el);var h={height:"300px",width:"580px",dompath:true,filterWord:true};var j=this.options.opts;for(var g in j){if(c.hasOwnProperty(j,g)){h[g]=j[g]}}var e=((this.options.editorType&&(this.options.editorType=="simple"))?b.widget.SimpleEditor:b.widget.Editor);if(e){this.editor=new e(k,h);this.editor.render()}else{alert("Editor is not on the page")}this.editor.filter_msword=function(i){i=e.prototype.filter_msword.call(this,i);if(!this.get("filterWord")){return i}i=i.replace(/<!--[^>][\s\S]*-->/gi,"");i=i.replace(/<\/?meta[^>]*>/gi,"");i=i.replace(/<\/?link[^>]*>/gi,"");i=i.replace(/ class=('|")?MsoNormal('|")?/gi,"");i=d.Lang.trim(i);return i}},setValue:function(f,e){if(this.editor){var g=this.el.id+"_editor";if(!b.util.Dom.get(g)){this.el.value=f}else{this.editor.setEditorHTML(f)}}if(e!==false){this.fireUpdatedEvt()}},getValue:function(){var f;try{f=this.editor.saveHTML();return f}catch(e){return null}}});a.registerType("html",a.RTEField,[])},"3.0.0a",{requires:["inputex-field","yui2-editor"]});