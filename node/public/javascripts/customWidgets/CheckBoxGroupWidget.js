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

    if(value == undefined)
    {
        this.selectedValues = [];
        this.selectedLabels = [];
        this.otherText = "";
    }
    else
    {
        this.selectedValues = value.value;
        this.selectedLabels = value.label;
        this.otherText = value.otherText;
    }
};

// Удалить значение из выбранных (если оно есть).
CheckBoxGroupWidget.prototype.removeValue = function(value)
{
    var index = this.selectedValues.indexOf(value);
    if(index != -1)
    {
        this.selectedValues.splice(index, 1);
        this.selectedLabels.splice(index, 1);
    }
};

// Проверить, есть ли значение среди выбранных.
CheckBoxGroupWidget.prototype.checkValue = function(value)
{
    if(this.selectedValues == undefined)
        return false;
    
    var index = this.selectedValues.indexOf(value);
    if(index != -1)
        return true;
    else return false;
};

// Добавить значение в выбранные (если его ещё нет).
CheckBoxGroupWidget.prototype.addValue = function(value, label)
{
    if(value == undefined || label == undefined)
        return;

    var index = this.selectedValues.indexOf(value);
    if(index == -1)
    {
        this.selectedValues.push(value);
        this.selectedLabels.push(label);
    }
};

// Добавить значение в выбранные (если его ещё нет).
CheckBoxGroupWidget.prototype.setOtherText = function(text)
{
    this.otherText = text;
};

// Получение значения виджета.
CheckBoxGroupWidget.prototype.getValue = function()
{
  return {"value":this.selectedValues, "label":this.selectedLabels, "otherText":this.otherText};
};

// Значение виджета для вставки в документ.
CheckBoxGroupWidget.prototype.getDocumentValue = function()
{ 
  return "";
};

// Валидация ввода. Кол-во выбранных элементов лежит в отрезке [minSelection; maxSelection]
CheckBoxGroupWidget.prototype.validate = function()
{
    if(this.selectedValues.length >= this.minSelection || typeof(this.minSelection) == "undefined")
        var minChecked = true;
    else var minChecked = false;
    
    if(this.selectedValues.length <= this.maxSelection || typeof(this.maxSelection) == "undefined")
        var maxChecked = true;
    else var maxChecked = false;
    
    if(minChecked && maxChecked)
        return true;
    else return false;
};