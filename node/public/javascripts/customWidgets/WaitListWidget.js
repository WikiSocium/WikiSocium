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
  };  
  
  // if(typeof(value) != "undefined" && typeof(value) != "string")
  //     this.timersValues = value;
  // else
  //     this.timersValues = {};
};

WaitListWidget.prototype.getValue = function()
{
  // return this.timersValues;
  return "not passable";
};

WaitListWidget.prototype.validate = function()
{
  return true;
};
