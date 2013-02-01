/*
Класс группы чекбоксов.
*/

// Конструктор.
// value: выбранное значение
// value_list: список выбранных значений
function CheckBoxGroupWidget(value, value_list)
{ 
    // значение по умолчанию
    this.minSelection = 0;
    this.selectedValues = [];
    this.selectedLabels = [];
    this.otherText = "";

    if(value.value != undefined && value.label != undefined)
    {
        // заданы value и label
        this.selectedValues.push(value.value);
        this.selectedLabels.push(value.label);
        this.otherText = value.otherText;
        
        return;
    }
    
    if(value != undefined)
    {
        // задано только value, label не задан (получим его из списка value_list)
        var label = undefined;
        for(i in value_list)
        {
            if(value_list[i].value == value)
            {
                label = value_list[i].label;
                break;
            }
        }

        if(label != undefined)
        {
            this.selectedValues.push(value);
            this.selectedLabels.push(label);
            this.otherText = "";

            return;
        }
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