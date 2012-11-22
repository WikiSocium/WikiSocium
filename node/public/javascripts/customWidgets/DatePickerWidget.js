/*
Класс виджета "DatePicker".
*/

// Типа конструктор.
function DatePickerWidget(element, parentEl, value)
{ 
  this.element = element;
  this.parentEl = parentEl;
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  
  
  // Валидация вроде не требуется, т.к. запрещено редактирование даты с клавиатуры.
  /*
  $(this.element).valid8({
        'regularExpressions': [
        { expression: '/^([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2})$/', errormessage: 'Поле заполнено неверно!'}
        ]
  });
  */
  
  // Переформатируем дату в формат dd.mm.yy
  if(value != "")
  { 
    var tempDate = new Date();
    var dateParse = Date.parse(value);
    if(!isNaN(dateParse))
    {
        tempDate.setTime(dateParse);
        value = $.datepicker.formatDate('dd.mm.yy', tempDate);
    }
    else
    {
        value = "";
        console.log('Error parsing date ' + value + ', cannot change its format');
    }
  }
  
  
  $(this.element).val(value);
};

function censor(censor) {
  return (function() {
    var i = 0;

    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
        return '[Circular]'; 

      if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
        return '[Unknown]';

      ++i; // so we know we aren't using the original object anymore

      return value;  
    }
  })(censor);
}

// Получение значения виджета.
DatePickerWidget.prototype.getValue = function()
{ 
  if($(this.element).val() == "")
    return "";
  
  var dateString = $(this.element).datepicker("getDate").toGMTString();
  
  return dateString;
};

// Валидация ввода.
DatePickerWidget.prototype.validate = function()
{
  return true;
};