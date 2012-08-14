// function DocumentViewWidget(element, parentEl, value)
function DocumentViewWidget(value)
{ 
  // this.element = element;
  // this.parentEl = parentEl;
  
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  
  if(typeof(value) != "undefined" && typeof(value) != "string")
      this.timersValues = value;
  else
      this.timersValues = {};
};

DocumentViewWidget.prototype.getValue = function()
{
  return this.timersValues;
};

DocumentViewWidget.prototype.validate = function()
{
  return true;
};
