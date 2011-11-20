YUI.add("inputex-color",function(c){var a=c.inputEx,b=c.Lang;a.ColorField=function(d){a.ColorField.superclass.constructor.call(this,d)};c.extend(a.ColorField,a.Field,{setOptions:function(d){a.ColorField.superclass.setOptions.call(this,d);this.options.className=d.className?d.className:"inputEx-Field inputEx-ColorField inputEx-PickerField";this.options.palette=d.palette;this.options.colors=d.colors;if(d.ratio){this.options.ratio=d.ratio}if(d.cellPerLine){this.options.cellPerLine=d.cellPerLine}},renderOverlay:function(){this.oOverlay=new c.Overlay({visible:false,zIndex:4});this.oOverlay.render();c.one(c.DOM._getWin().document).on("click",function(d){var f=d.target._node;if(f!=this.button._node&&f!=this.colorEl){this.oOverlay.hide()}},this)},_toggleOverlay:function(d){this.renderPalette();if(this.oOverlay.get("visible")){this.oOverlay.hide()}else{this.oOverlay.show();this.oOverlay.set("align",{node:this.button,points:[c.WidgetPositionAlign.TL,c.WidgetPositionAlign.BL]})}},renderComponent:function(){this.el=a.cn("input",{type:"hidden",name:this.options.name||"",value:this.options.value||"#FFFFFF"});this.colorEl=a.cn("div",{className:"inputEx-ColorField-button"},{backgroundColor:this.el.value});this.wrapEl=a.cn("div",{className:"inputEx-PickerField-wrapper"});this.wrapEl.appendChild(this.el);this.wrapEl.appendChild(this.colorEl);this.button=c.Node.create("<button>&nbsp;</button>").addClass("inputEx-ColorField-button");this.button.appendTo(this.wrapEl);this.button.on("click",this._toggleOverlay,this,true);c.one(this.colorEl).on("click",this._toggleOverlay,this,true);this.fieldContainer.appendChild(this.wrapEl)},renderPalette:function(){if(!this.oOverlay){this.renderOverlay()}if(this.paletteRendered){return}var e,d;e=this.options.palette||1;this.colors=this.options.colors||this.setDefaultColors(e);this.length=this.colors.length;this.ratio=this.options.ratio||[16,9];this.cellPerLine=this.options.cellPerLine||Math.ceil(Math.sqrt(this.length*this.ratio[0]/this.ratio[1]));this.cellPerColumn=Math.ceil(this.length/this.cellPerLine);this.colorGrid=this.renderColorGrid();this.oOverlay.set("bodyContent",this.colorGrid);this.button.unsubscribe("click",this.renderPalette);this.paletteRendered=true;this.markSelectedColor()},setDefaultColors:function(d){return a.ColorField.palettes[d-1]},renderColorGrid:function(){var f,g,e;this.squares=[];f=a.cn("div",{className:"inputEx-ColorField-Grid"});for(e=0;e<this.length;e++){g=a.cn("div",{className:"inputEx-ColorField-square"},{backgroundColor:this.colors[e]});f.appendChild(g);this.squares.push(g);if(e%this.cellPerLine===this.cellPerLine-1||e===this.length-1){f.appendChild(a.cn("br",{clear:"both"}))}}var d=c.one(f);d.delegate("click",c.bind(this.onColorClick,this),"div.inputEx-ColorField-square");return d},onColorClick:function(i,h,f){i.halt();this.oOverlay.hide();var g=i.currentTarget.getStyle("backgroundColor");var d=a.ColorField.ensureHexa(g);this.setValue(d)},setValue:function(e,d){this.el.value=e;this.markSelectedColor(e);a.ColorField.superclass.setValue.call(this,e,d)},getValue:function(){return this.el.value},close:function(){this.oOverlay.hide()},destroy:function(){if(this.colorGrid){}a.ColorField.superclass.destroy.call(this)},markSelectedColor:function(e){var d;e=e||this.getValue();if(!!e&&this.paletteRendered){e=e.toLowerCase();for(d=0;d<this.length;d++){if(this.colors[d].toLowerCase()===e){c.one(this.squares[d]).addClass("selected")}else{c.one(this.squares[d]).removeClass("selected")}}}c.one(this.colorEl).setStyle("backgroundColor",this.el.value)}});a.ColorField.palettes=[["#FFEA99","#FFFF66","#FFCC99","#FFCAB2","#FF99AD","#FFD6FF","#FF6666","#E8EEF7","#ADC2FF","#ADADFF","#CCFFFF","#D6EAAD","#B5EDBC","#CCFF99"],["#DEDFDE","#FFFF6B","#EFCB7B","#FFBE94","#FFB6B5","#A5E3FF","#A5CBFF","#99ABEF","#EFB2E7","#FF9AAD","#94E7C6","#A5FFD6","#CEFFA5","#E7EF9C","#FFE38C"],["#000000","#993300","#333300","#003300","#003366","#000080","#333399","#333333","#800000","#FF6600","#808000","#008000","#008080","#0000FF","#666699","#808080","#FF0000","#FF9900","#99CC00","#339966","#33CCCC","#3366FF","#800080","#969696","#FF00FF","#FFCC00","#FFFF00","#00FF00","#00FFFF","#00CCFF","#993366","#C0C0C0","#FF99CC","#FFCC99","#FFFF99","#CCFFCC","#CCFFFF","#99CCFF","#CC99FF","#F0F0F0"],["#FFFFCC","#FFFF99","#CCFFCC","#CCFF66","#99FFCC","#CCFFFF","#66CCCC","#CCCCFF","#99CCFF","#9999FF","#6666CC","#9966CC","#CC99FF","#FFCCFF","#FF99FF","#CC66CC","#FFCCCC","#FF99CC","#FFCCCC","#CC6699","#FF9999","#FF9966","#FFCC99","#FFFFCC","#FFCC66","#FFFF99","#CCCC66"],["#D0D0D0","#31A8FA","#8EC1E5","#58D7CF","#89E2BB","#A7F7F8","#F6B77C","#FE993F","#FE6440","#F56572","#FA9AA3","#F7B1CA","#E584AF","#D1C3EF","#AB77B8","#C69FE7","#90D28A","#C2F175","#EDEA9A","#F3DF70","#F8D1AE","#F98064","#F54F5E","#EC9099","#F0B5BA","#EDA0BB","#D375AC","#BC8DBE","#8C77B8"],["#EEEEEE","#84CBFC","#BCDAF0","#9BE7E3","#B9EED7","#CBFBFB","#FAD4B1","#FFC28C","#FFA28D","#F9A3AB","#FCC3C8","#FBD1E0","#F0B6CF","#E4DBF6","#CDAED5","#DDC6F1","#BDE4B9","#DBF7AD","#F5F3C3","#F8ECAA","#FBE4CF","#FCB3A2","#F9969F","#F4BDC2","#F6D3D6","#F5C6D7","#E5ADCE","#D7BBD8","#BAAED5"]];a.ColorField.ensureHexa=function(e){var f,d;e=e.replace(/\s/g,"");if(!!e.match(/^rgb\((?:\d{1,3},){2}\d{1,3}\)$/)){var g=function(i){var h=parseInt(i,10).toString(16);if(h.length==1){h="0"+h}return h};f=e.split(/([(,)])/);d="#"+g(f[2])+g(f[4])+g(f[6])}else{if(!!e.match(/^#[\da-fA-F]{6}$/)){d=e}else{d="#FFFFFF"}}return d};a.registerType("color",a.ColorField,[])},"3.0.0a",{requires:["inputex-field","node-event-delegate","overlay"]});