// Здесь методы, устанавливающие значения виджетов в solutionData для расчёта предикатов видимости..

// Метод, устанавливающий значения виджетов в solutionData.
// Действует на виджеты, входящие в предикаты видимости на шаге stepnum.
// На входе номер шага
// Ничего не возвращает
function SetWidgetValueForPredicatesOnStep(stepnum)
{
    var tcp = solutionData.steps[stepnum];

    // Обработка массива виджетов
    if (tcp.widgets != undefined)
    {
        for (var i in tcp.widgets)
        {
            var iv = tcp.widgets[i].isVisible;  // Условие на видимость этого виджета
            if (iv != undefined && iv.predicates != undefined)
            {
                SetWidgetValueForPredicateArray(stepnum, iv.predicates);
            }
        }
    }
    
    // Обработка массива групп виджетов
    if (tcp.widget_groups != undefined)
    {
        for (var i in tcp.widget_groups)
        {
            var iv = tcp.widget_groups[i].isVisible;
            if (iv != undefined && iv.predicates != undefined)
            {
                SetWidgetValueForPredicateArray(stepnum, iv.predicates[j])
            }
            
            if (tcp.widget_groups[i].widgets != undefined)
            {    
                for (var j in tcp.widget_groups[i].widgets)
                {
                    var iv = tcp.widget_groups[i].widgets[j].isVisible;
                    if (iv != undefined && iv.predicates != undefined)
                    {
                        for (var j in iv.predicates)
                        {
                           SetWidgetValueForPredicate(stepnum, iv.predicates[j]);
                        }
                    }
                }
            }
        }    
    }
}

// Установить значения в soludtionData для виджетов из массива предикатов predicates.
function SetWidgetValueForPredicateArray(stepnum, predicates)
{
    for (var j in predicates)
    {
        // Правило вида ([А и Б] ИЛИ [С и Д]) - массив массивов предикатов
        if (predicates[j] != undefined && IsArray(predicates[j]))
        {
            for(var k in predicates[j])
            {
                SetWidgetValueForPredicate(stepnum, predicates[j][k]);
            }
        }
        else    // Правило вида (А и Б и С и Д) - массив предикатов
        {
            SetWidgetValueForPredicate(stepnum, predicates[j]);
        }
    }
}

// Установить в solutionData значение виджета, входящего в предикат predicate на шаге с номером stepnum
function SetWidgetValueForPredicate(stepnum, predicate)
{
    var sid = predicate.step_id;
    
    var sn;
    if (sid == undefined) sn = stepnum;
    else sn = currentCaseData.GetStepIndexById(sid);
    
    var wid = predicate.widget_id;
    
    var data;
    if ((sn < 0) || (sn >= groups.length)) 
    {
        data = undefined;
    }
    
    data = groups[sn][wid].getValue();
    SetWidgetValue(sn, wid, data);
}
