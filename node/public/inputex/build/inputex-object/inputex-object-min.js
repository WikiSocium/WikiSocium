YUI.add("inputex-object",function(c){var a=c.inputEx,b=c.Lang;a.ObjectField=function(d){d.elementType={type:"combine",fields:[{type:"string",size:10},{type:"string",size:10}]};a.ObjectField.superclass.constructor.call(this,d)};c.extend(a.ObjectField,a.ListField,{getValue:function(){var d=a.ObjectField.superclass.getValue.call(this);var f={};for(var e=0;e<d.length;e++){f[d[e][0]]=d[e][1]}return f},setValue:function(d){var f=[];for(var e in d){if(d.hasOwnProperty(e)){f.push([e,d[e]])}}a.ObjectField.superclass.setValue.call(this,f)}});a.registerType("object",a.ObjectField)},"3.0.0a",{requires:["inputex-list","inputex-combine","inputex-string"]});