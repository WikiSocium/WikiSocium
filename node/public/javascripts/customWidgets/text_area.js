function TextArea(element, parentEl)
{ 
  this.element = element;
  this.parentEl = parentEl;
};

TextArea.prototype.getValue = function()
{
  return $(this.element).val();
};

TextArea.prototype.validate = function()
{
  return true;
};
