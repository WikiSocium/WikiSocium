/*
Класс списка регионов.
Отличается от обычного класса списка форматом возвращаемого значения.
*/

// Конструктор.
function RegionsListWidget(value)
{ 
    // значение по умолчанию
    this.selectedValue = [];
    
    if(value != undefined)
    {
        this.selectedValue = value;
    }
};

// Установка значения виджета.
RegionsListWidget.prototype.setValue = function(value)
{
    if(value != undefined)
    {
        this.selectedValue = value;
    }
};

// Получение значения виджета.
RegionsListWidget.prototype.getValue = function()
{
  return this.selectedValue;
};

// Валидация ввода.
RegionsListWidget.prototype.validate = function()
{
    return true;
};