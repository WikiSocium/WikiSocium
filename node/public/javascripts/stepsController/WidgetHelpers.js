// Здесь вспомогательные методы для работы с виджетами.

// Возвращает значение виджета wid на шаге sn из solutionData.
function GetWidgetValue(sn, wid)
{
    var st = solutionData.steps[sn];
    var value = "undefined";
    
    for (var i in st.widgets)
    {
        var w = st.widgets[i];
        if (w.id == wid)
            value = w.widget_value;
    }
    
    for (var i in st.widget_groups)
    {
        var wg = st.widget_groups[i];
        for (var j in wg.widgets)
        {
            var w = wg.widgets[j];
            if (w.id == wid)
                value = w.widget_value;
        }
    }

    return value;
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