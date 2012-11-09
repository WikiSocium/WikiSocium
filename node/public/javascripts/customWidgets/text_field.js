function TextField(regexp, element, parentEl, value)
{ 
  this.element = element;
  this.parentEl = parentEl;
  this.regexp = regexp;
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  
  $(this.element).valid8({
        'regularExpressions': [
        { expression: regexp, errormessage: 'Поле заполнено неверно!'}
        ]
  });
  
  $(this.element).val(value);
};

TextField.prototype.getValue = function()
{
  return $(this.element).val();
};

TextField.prototype.validate = function()
{
  var res = this.regexp.test($(this.element).val());
  if(!res) $(this.parentEl).attr('class', 'baseWidget error');
  return res;
};