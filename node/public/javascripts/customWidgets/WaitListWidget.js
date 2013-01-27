// function WaitListWidget(element, parentEl, value)
function WaitListWidget(value)
{ 
  // this.element = element;
  // this.parentEl = parentEl;
  
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
      console.log(param);
  };  
  
  this.passable = value;
};

WaitListWidget.prototype.getValue = function()
{
  return this.passable;
};

WaitListWidget.prototype.validate = function()
{
  return true;
};
