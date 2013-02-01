/*
Класс списка/комбобокса.
*/

// Конструктор.
function ListWidget(value, value_list)
{ 
    // значение по умолчанию
    this.selectedValue = [];
    this.selectedLabel = [];
    
    if(value.value != undefined && value.label != undefined)
    {
        // заданы value и label
        this.selectedValue = value.value;
        this.selectedLabel = value.label;
        
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
            this.selectedValue = value;
            this.selectedLabel = label;

            return;
        }
    }
};

// Установка значения виджета.
ListWidget.prototype.setValue = function(value, label)
{
    if(value != undefined && label != undefined)
    {
        this.selectedValue = value;
        this.selectedLabel = label;
    }
};

// Получение значения виджета.
ListWidget.prototype.getValue = function()
{
  return {"value":this.selectedValue, "label":this.selectedLabel};
};

// Валидация ввода.
ListWidget.prototype.validate = function()
{
    return true;
};