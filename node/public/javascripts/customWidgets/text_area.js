function TextArea(element, parentEl)
{ 
  this.element = element;
  this.parentEl = parentEl;
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
};

TextArea.prototype.getValue = function()
{
  return $(this.element).val();
};

TextArea.prototype.validate = function()
{
  return true;
};
