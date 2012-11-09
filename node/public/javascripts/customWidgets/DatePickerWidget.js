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
  
  // TODO: вернуться к этому коду, если в процессе эксплуатации полезут ошибки с форматом даты.
  // Пока закомменчено в надежде, что даты будут всегда сохраняться в формате, заданном в DatePickerWidget.jade - "dd.mm.yy".
  // Выявленные проблемы с переформатированием:
  // 1) Date.parse не парсит формат "dd.mm.yy" в FireFox.
  // 2) в дате 11.11.2011 не понятно где месяц, где число => всё равно универсальный парсер для дат не получится.
  /*
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
    else console.log('Error parsing date ' + value + ', cannot change its format')
  }
  */
  
  $(this.element).val(value);
};

// Получение значения виджета.
DatePickerWidget.prototype.getValue = function()
{
  return $(this.element).val();
};

// Валидация ввода.
DatePickerWidget.prototype.validate = function()
{
  return true;
};