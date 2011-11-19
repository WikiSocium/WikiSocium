YUI.add("inputex-datatable",function(c){var a=c.inputEx.messages;function b(){b.superclass.constructor.apply(this,arguments)}c.mix(b,{NS:"inputex",NAME:"datatableInputex",ATTRS:{panel:{valueFn:"_initPanel",lazyAdd:true},inputEx:{value:null},mode:{value:null,},modifyColumnLabel:{value:a.modifyText},deleteColumnLabel:{value:a.deleteText},deleteColumn:{value:null},confirmDelete:{value:true},modifyRecord:{},deleteTemplate:{}},fieldsToColumndefs:function(d){var e=[];for(var f=0;f<d.length;f++){e.push(this.fieldToColumndef(d[f]))}return e},fieldToColumndef:function(g){var f,e,d;f=g.name;e=g.label;columnDef={key:f,label:e,sortable:true,resizeable:true};if(g.type=="date"){columnDef.formatter=YAHOO.widget.DataTable.formatDate}else{if(g.type=="integer"||g.type=="number"){columnDef.formatter=YAHOO.widget.DataTable.formatNumber}}return columnDef}});c.extend(b,c.Plugin.Base,{initializer:function(d){var e=this.get("host");this.doAfter("renderUI",this._afterRenderUI);this.doAfter("_addTheadTrNode",this._afterAddTheadTrNode);this.doAfter("_createTbodyTrNode",this._afterCreateTbodyTrNode);this.publish("addRow");this.publish("modifyRow");this.publish("deleteRow");e.delegate("click",c.bind(this._onRemoveLabelClick,this),"td.delete_column");e.delegate("click",c.bind(this._onModifyLabelClick,this),"td.modify_column")},_afterRenderUI:function(){this._renderAddButton()},_renderAddButton:function(){var d=c.Node.create("<button>"+a.addButtonText+"</button");d.on("click",c.bind(this._onAddButtonClick,this));d.appendTo(this.get("host").get("contentBox"))},_onAddButtonClick:function(d){this.set("mode","add");this.get("panel").get("field").clear();this.showPanel()},_initPanel:function(){var e=this;var d=new c.inputEx.Panel({centered:true,width:500,modal:true,zIndex:5,visible:false,inputEx:this.get("inputEx"),headerContent:"AddItem",buttons:[{value:"Save",action:function(g){g.preventDefault();d.hide();var f=(e.get("mode")=="modify")?"modifyRow":"addRow";e.fire(f,{data:d.get("field").getValue()})},section:c.WidgetStdMod.FOOTER},{value:"Cancel",action:function(f){f.preventDefault();d.hide()},section:c.WidgetStdMod.FOOTER}]});d.render();return d},showPanel:function(){this.get("panel").show()},_afterAddTheadTrNode:function(i,e,h){if(e){var g=this.get("host");var f=new c.Column({label:this.get("modifyColumnLabel"),key:"modify_column"});g._addTheadThNode({value:f.get("label"),column:f,tr:i.tr});this.set("modifyColumn",f);var d=new c.Column({label:this.get("deleteColumnLabel"),key:"delete_column"});g._addTheadThNode({value:d.get("label"),column:d,tr:i.tr});this.set("deleteColumn",d)}},_afterCreateTbodyTrNode:function(d){var e=this.get("host");this._createModifyColumn(d);this._createDeleteColumn(d)},_createDeleteColumn:function(d){var f={};f.headers=d.column.headers;f.value="delete";f.classnames=d.classnames+" delete_column";var e=c.Lang.sub(c.DataTable.Base.prototype.tdTemplate,f);f.td=c.Node.create(e);f.td.record=d.record;f.td.tr=d.tr;d.tr.appendChild(f.td)},_createModifyColumn:function(d){var f=this.get("host");var g={};g.headers=d.column.headers;g.value="modify";g.classnames=d.classnames+" modify_column";var e=c.Lang.sub(c.DataTable.Base.prototype.tdTemplate,g);g.td=c.Node.create(e);g.td.record=d.record;g.td.tr=d.tr;d.tr.appendChild(g.td)},_onModifyLabelClick:function(j){var k=j.currentTarget,i=k.tr,d=k.record,g=this.get("host"),f=g.get("recordset");this.set("mode","modify");this.set("modifyRecord",d);var h=d.get("data");this.get("panel").get("field").setValue(h);this.showPanel()},_onRemoveLabelClick:function(d){if(!this.get("confirmDelete")||confirm(a.confirmDeletion)){this.fire("deleteRow",d)}},confirmDelete:function(i){var j=i.currentTarget,h=j.tr,d=j.record,g=this.get("host"),f=g.get("recordset");f.remove(f.indexOf(d));h.remove()},addRow:function(f){var e=this.get("host"),d=e.get("recordset");d.add(f);e._uiSetRecordset(d)},modifyRow:function(h,f){var g=this.get("host"),e=g.get("recordset");var d=this.get("modifyRecord");d.set("data",h);g._uiSetRecordset(e)}});c.namespace("Plugin").DatatableInputex=b},"3.0.0a",{requires:["inputex-group","inputex-panel","datatable"]});