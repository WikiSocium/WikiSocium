// Здесь вспомогательные методы для работы с виджетами.

// Рекурсивный поиск полей "step_id" и "widget_id" в объекте obj.
// Запись результатов в nextPredicateWidgets.
function SearchNextPredicateWidgets(obj, nextPredicateWidgets)
{
    if(obj != undefined && obj.widget_id != undefined)
    {
        var widget_id = obj.widget_id;
        if(nextPredicateWidgets.widget_id.indexOf(widget_id) == -1)
        {
            nextPredicateWidgets.widget_id.push(widget_id);
            if(obj.step_id != undefined)
                nextPredicateWidgets.step_id.push(obj.step_id);
            else 
                nextPredicateWidgets.step_id.push(undefined);
        }
    }
    
    for (i in obj)
    {
        if (typeof(obj[i]) == "object")
        {
            SearchNextPredicateWidgets(obj[i], nextPredicateWidgets);
        }
    }
}

// Возвращает описание виджета из солюшена по id шага и id виджета.
function GetWidgetById(solutionData, step_index, widget_id)
{
    var tcp = solutionData.steps[step_index];
    
    // Обработка групп виджетов
    for (var i in tcp.widget_groups)
    {
        var group = tcp.widget_groups[i];
        
        for(var j in group.widgets)
        {
            if(group.widgets[i].id == widget_id)
                return group.widgets[i];
        }
    }
    
    for(var i in tcp.widgets)
    {
        if(tcp.widgets[i].id == widget_id)
            return tcp.widgets[i];
    }
    
    return undefined;
}

// Возвращает значение виджета wid на шаге sn из solutionData.
function GetWidgetValue(sn, wid)
{
    var st = solutionData.steps[sn];
    var value = "undefined";
    var widget_itself = {};
    
    for (var i in st.widgets)
    {
        var w = st.widgets[i];
        if (w.id == wid)
        {
            value = w.widget_value;
            widget_itself = w;
        }        
    }
    
    for (var i in st.widget_groups)
    {
        var wg = st.widget_groups[i];
        for (var j in wg.widgets)
        {
            var w = wg.widgets[j];
            if (w.id == wid)
            {
                value = w.widget_value;
                widget_itself = w;
            }
        }
    }

    var w_v_v = true;
    
    if(typeof widget_itself.isVisible != 'undefined' && typeof widget_itself.isVisible.predicates != 'undefined')    
      for(p in widget_itself.isVisible.predicates)
        //.isVisible.predicates[p]
        w_v_v &= CountObjectVisibility(widget_itself);

    console.log("for " + wid + " w_v_v = " + w_v_v);

    if(w_v_v)    
      return value;
    else
      return undefined;
}

// Установить в solutionData для виджета wid на шаге sn значение data.
function SetWidgetValue(sn, wid, data)
{
    var st = solutionData.steps[sn];

    for (var i in st.widgets)
    {
        if (st.widgets[i].id == wid)
            st.widgets[i].widget_value = data; 
    }
    for (var i in st.widget_groups)
    {
        for (var j in st.widget_groups[i].widgets)
        {
            if (st.widget_groups[i].widgets[j].id == wid)
                st.widget_groups[i].widgets[j].widget_value = data;
        }
    }
}

// Установить в solutionData для виджета wid на шаге c stepid (или stepnum, если stepid не задан) текущее значение виджета.
function SetWidgetValueForWidget(stepnum, stepid, wid)
{
    var sn;
    if (stepid == undefined) sn = stepnum;
    else sn = currentCaseData.GetStepIndexById(stepid);
    var data;
    if ((sn < 0) || (sn >= groups.length)) 
    {
        data = undefined;
    }
    else data = groups[sn][wid].getValue();
    SetWidgetValue(sn, wid, data);
}