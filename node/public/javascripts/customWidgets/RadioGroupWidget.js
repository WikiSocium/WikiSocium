function RadioGroupWidget(value)
{ 
  
  // this.element = element;
  // this.parentEl = parentEl;
  // this.regexp = regexp;
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  // $(this.element).valid8({
  //       'regularExpressions': [
  //       { expression: regexp, errormessage: 'Поле заполнено неверно!'}
  //       ]
  // });
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
  // var res = this.regexp.test($(this.element).val());
  // if(!res) $(this.parentEl).attr('class', 'baseWidget error');
  // return res;
  return true;
};