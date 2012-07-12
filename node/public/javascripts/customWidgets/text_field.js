function TextField(regexp, element, parentEl)
{ 
  this.element = element;
  this.parentEl = parentEl;
  this.regexp = regexp;
  $(this.element).valid8({
        'regularExpressions': [
        { expression: regexp, errormessage: 'Поле заполнено неверно!'}
        ]
  });
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