// Здесь методы для изменения видимости виджетов в зависимости от введённых настроек.

// Проверить и при необходимости изменить видимость групп виджетов и отдельных виджетов на шаге с номером stepnum
function CountVisibility(stepnum)
{
    var tcp = solutionData.steps[stepnum];
    
    // Обработка групп виджетов
    for (var i in tcp.widget_groups)
    {
        var group = tcp.widget_groups[i];
        
        // Видимость всей группы
        CountObjectVisibility(group);
        
        // Видимость отдельных виджетов внутри группы
        if (group.visible == true)
        {
            for (var i in group.widgets)
            {
                var w = group.widgets[i];
                CountObjectVisibility(w);
            }
        }
    }
    
    // Обработка массива виджетов (не входящих в группы или если группы не заданы)
    for (var i in tcp.widgets)
    {
        var widget = tcp.widgets[i];
        CountObjectVisibility(widget);
    }
}

// Метод проверяет тип массива предикатов.
// Возвращает true, если свойство имеет вид массива массивов предикатов [[А и Б] или [В и Г]]
// И false, если свойство имеет вид массива предикатов [А и Б и В]
function IsPredicateOfTypeOR(predicates)
{
    var formatOR = false;
    if(IsArray(predicates))
        if(IsArray(predicates[0]))
            formatOR = true;
    return formatOR;
}

// Проверить и при необходимости изменить настройки видимости объекта obj.
// На входе объект obj с полями isVisible (предикаты видимости) и visible (булево, видим/не видим).
// Ничего не возвращает.
function CountObjectVisibility(obj)
{
    // если предикаты не заданы или тождественно равны истине, то виджет видим и так
    if (obj.isVisible == undefined || obj.isVisible == "true")
        obj.visible = true;
    // если предикат тождественно равен лжи, виджет естественно невидим
    else if (obj.isVisible == "false")
        obj.visible = false;
    else // в противном случае будем вычислять предикаты
    {
        var resultVisible = true;
        
        // Эмпирически определим формат записи предиката
        var formatOR = IsPredicateOfTypeOR(obj.isVisible.predicates);
        
        // Условие представляет собой массив массивов предикатов.
        // Массивы предикатов объединены логической операцией ИЛИ, предикаты объединены логической операцией И.
        if(formatOR)
        {
            resultVisible = false;
        
            for (var j in obj.isVisible.predicates)
            {
                var massVisible = true;
                for(var k in obj.isVisible.predicates[j])
                {
                    massVisible = CheckPredicate(obj.isVisible.predicates[j][k], massVisible);
                }
                
                resultVisible = resultVisible || massVisible;
            }
        }
        else    // Условие представляет собой массив предикатов, объединённых логической операцией И
        {
            resultVisible = true;
            
            // Пройдём по массиву предикатов
            for (var k in obj.isVisible.predicates)
            {
                resultVisible = CheckPredicate(obj.isVisible.predicates[k], resultVisible);
            }
        }
        
        obj.visible = resultVisible;
    }
}

function CheckPredicate(predicate, currentVisibility)
{
    // Вычислим Id шага на котором находится виджет, значение которого задействовано в предикате
    var sourceStep = currentCaseData.GetStepIndexById(predicate.step_id);
    
    // Если Id невалидный, то пусть виджет невидим будет
    if (sourceStep == undefined || sourceStep < 0)
    {
        currentVisibility = false;
    }
    else // Иначе проверяем предикат. Предикаты объединены логической операцией И.
    {
        currentVisibility = currentVisibility && CheckPredicate(predicate, sourceStep);
    }
    
    return currentVisibility;
}

// Проверяет выполнение 1 предиката
// На входе 1 предикат
// На выходе bool
function CheckPredicate(predicate) 
{
    var value;
    if (predicate.step_id != undefined)
        value = GetWidgetValue(currentCaseData.GetStepIndexById(predicate.step_id), predicate.widget_id);
    else
        value = GetWidgetValue(currentCaseData.GetStepIndexById(currentStepId), predicate.widget_id);
        
    if (typeof value == "undefined") 
    { 
        return false;
    }

    if(value instanceof Object && value.value != undefined)
		value = value.value;
  
    switch(predicate.cond) 
    {
        case "==":  return (value == predicate.value);
        case "!=":  return (value != predicate.value);
        case "<=":  return (value <= predicate.value);
        case ">=":  return (value >= predicate.value);
        case ">":   return (value > predicate.value);
        case "<":   return (value < predicate.value);
        case "has":
            if(IsArray(value))
            {
                var index = value.indexOf(predicate.value);
                
                if(index == -1)
                    return false;
                else return true;
            }
            else if(value == predicate.value)
                return true;
            else return false;
            break;
        default:	return false;
    }
}