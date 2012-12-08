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
  
  // Валидация во время ввода.
  // Валидация не требуется, т.к. запрещено редактирование даты с клавиатуры.
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

// Получение значения виджета.
// Дата возвращается в формате UTC, то есть от московского времени отличается на 4 часа.
DatePickerWidget.prototype.getValue = function()
{ 
  if($(this.element).val() == "")
    return "";
  
  var date = $(this.element).datepicker("getDate");
  if(date == undefined)
    return "";
  
  var dateString = date.toUTCString();
  
  return dateString;
};

// Значение виджета для вставки в документ.
DatePickerWidget.prototype.getDocumentValue = function()
{ 
  //var docValue = $(this.element).val();
	var date = $(this.element).datepicker("getDate");
  var DateUTC = null;
	if(date != undefined)
    DateUTC = Date.parse(date);
  var docValue = {value:    $(this.element).val(),
									UTC: DateUTC};
  return docValue;
};

// Валидация ввода.
DatePickerWidget.prototype.validate = function()
{
  // Не требуется, т.к. запрещено редактирование даты с клавиатуры.
  return true;
};