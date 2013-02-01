function RadioGroupWidget(value)
{ 
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  

  if(typeof(value) == "undefined")
  {
    this.selection_value = "";
    this.selection_label = "";
  }
  else
  {
    this.selection_value = value.value;
    this.selection_label = value.label;
  }
};

RadioGroupWidget.prototype.getValue = function()
{
  return {value : this.selection_value,
        label : this.selection_label};
};

RadioGroupWidget.prototype.validate = function()
{
  return true;
};