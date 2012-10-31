/*
Класс группы чекбоксов.
*/

// Типа конструктор.
function CheckBoxGroupWidget(value)
{ 
  this.minSelection = 0;
  this.options = {};
  this.IsRequired = true;
  this.setOptions = function(param)
  {
      this.options = param;
      this.IsRequired = param.required;
  };  

  if(typeof(value) == "undefined")
  {
    this.selection_list = "";
  }
  else
  {
    this.selection_list = value;
  }
};

// Добавить значение в выбранные (если его ещё нет).
CheckBoxGroupWidget.prototype.addValue = function(value)
{
  var index = this.selection_list.indexOf(value);
  if(index == -1)
    this.selection_list.push(value);
};

// Удалить значение из выбранных (если оно есть).
CheckBoxGroupWidget.prototype.removeValue = function(value)
{
  var index = this.selection_list.indexOf(value);
  if(index != -1)
    this.selection_list.splice(index,1);
};

// Получение значения виджета.
CheckBoxGroupWidget.prototype.getValue = function()
{
  return this.selection_list;
};

// Валидация ввода. Кол-во выбранных элементов лежит в отрезке [minSelection; maxSelection]
CheckBoxGroupWidget.prototype.validate = function()
{
    if(this.selection_list.length >= this.minSelection || this.minSelection == undefined)
        var minChecked = true;
    else var minChecked = false;
    
    if(this.selection_list.length <= this.maxSelection || this.maxSelection == undefined)
        var maxChecked = true;
    else var maxChecked = false;
    
    if(minChecked && maxChecked)
        return true;
    else return false;
};