YUI.add("inputex-dsselect",function(c){var b=c.Lang,a=c.inputEx;a.DSSelectField=function(d){a.DSSelectField.superclass.constructor.call(this,d)};c.extend(a.DSSelectField,a.SelectField,{setOptions:function(d){a.DSSelectField.superclass.setOptions.call(this,d);this.options.valueKey=d.valueKey||"value";this.options.labelKey=d.labelKey||"label";this.options.datasource=d.datasource},renderComponent:function(){a.DSSelectField.superclass.renderComponent.call(this);this.sendDataRequest("?all=true")},sendDataRequest:function(d){if(!!this.options.datasource){this.options.datasource.sendRequest({request:d,callback:{success:c.bind(this.onDatasourceSuccess,this),failure:c.bind(this.onDatasourceFailure,this)}})}},populateSelect:function(d){var e,f;while(this.el.childNodes.length>0){this.el.removeChild(this.el.childNodes[0])}for(e=0,f=d.length;e<f;e+=1){this.addChoice({value:d[e][this.options.valueKey],label:d[e][this.options.labelKey]})}},onDatasourceSuccess:function(d){this.populateSelect(d.response.results)},onDatasourceFailure:function(d){this.el.innerHTML="<option>error</option>"}});a.registerType("dsselect",a.DSSelectField)},"3.0.0a",{requires:["inputex-select","datasource"]});