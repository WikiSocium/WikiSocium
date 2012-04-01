URLOpenerWidget = function()
{
    this.fields = [];
}

URLOpenerWidget.prototype.getValue = function()
{
    var tmpList = [];
    for(var i = 0; i < this.fields.length; i++)
      tmpList.push(this.fields[i].getValue());
    return tmpList;
}

URLOpenerWidget.showData = function(urlsList)
{
    // [TODO]
    alert(urlsList);
}

URLOpenerWidget.prototype.addField = function()
{
    var tmp_this = this;
    YUI().use("inputex", "inputex-string", 
    function(Y){
        tmp_this.fields.push(new Y.inputEx.StringField({label: 'URL',
                                                    name: (new Date()),
                                                    value: 'input data here',
                                                    required: true,
                                                    parentEl: $(tmp_this).parent()[0]}));
        });
    this.fields = tmp_this.fields;
}

URLOpenerWidget.prototype.removeField = function(fieldIndex)
{
    var new_fields = [];
    for(var i = 0; i < this.fields.length; i++)
        if(i != fieldIndex)
            new_fields.push(this.fields[i]);
    this.fields = new_fields;
    // this.fields.splice(fieldIndex, fieldIndex);
}