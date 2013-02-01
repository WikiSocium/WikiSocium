/*
Класс чекбокса-одиночки.
*/

// Конструктор.
function CheckBoxWidget(value)
{ 
    if(value == undefined)
    {
        this.selectedValue = [];
        //this.selectedLabel = [];
    }
    else
    {
        if(value == true)
            this.selectedValue = true;
        else this.selectedValue = false;
        //this.selectedValue = value.value;
        //this.selectedLabel = value.label;;
    }
};

CheckBoxWidget.prototype.setValue = function(checked)
{
    this.selectedValue = checked;
};

// Получение значения виджета.
CheckBoxWidget.prototype.getValue = function()
{
    return this.selectedValue;
    //return {"value":this.selectedValue, "label":this.selectedLabel};
};

// Валидация ввода.
CheckBoxWidget.prototype.validate = function()
{
    return true;
};