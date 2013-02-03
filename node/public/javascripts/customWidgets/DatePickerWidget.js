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
    var regexp = /^([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2})$/;
    this.regexp = regexp;
  
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
  
    // Валидация ввода.
    $(this.element).val(value);

    $(this.element).valid8({
        'jsFunctions':
        [
            {
                function: function(values)
                {
                    var regexp = this.values[0]; // рег. выражение
                    var value = values; // значение
                    var res = true;
                    if(regexp != undefined)
                        res = regexp.test(value);

                    if(res || value == undefined || value == '') // пустые строки игнорируются
                        return {valid:true}
                    else 
                        return {valid:false, message:'Поле заполнено неверно!'} // текст, выводящийся при ошибке
                },
                values:
                [ 
                    regexp,
                    function()
                    {
                        return $(this).val();
                    }
                ]
            }
        ]
    }
  );
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
  var val = $(this.element).val();
  var res = this.regexp.test(val) || val == '';
  if(!res) {
    $(this.parentEl).children(".control-group").addClass("error");
  }
  return res;
};