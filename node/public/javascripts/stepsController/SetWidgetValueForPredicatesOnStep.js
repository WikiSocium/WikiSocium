// ����� ������, ��������������� �������� �������� � solutionData ��� ������� ���������� ���������..

// �����, ��������������� �������� �������� � solutionData.
// ��������� �� �������, �������� � ��������� ��������� �� ���� stepnum.
// �� ����� ����� ����
// ������ �� ����������
function SetWidgetValueForPredicatesOnStep(stepnum)
{
    var tcp = solutionData.steps[stepnum];

    // ��������� ������� ��������
    if (tcp.widgets != undefined)
    {
        for (var i in tcp.widgets)
        {
            var iv = tcp.widgets[i].isVisible;  // ������� �� ��������� ����� �������
            if (iv != undefined && iv.predicates != undefined)
            {
                SetWidgetValueForPredicateArray(stepnum, iv.predicates);
            }
        }
    }
    
    // ��������� ������� ����� ��������
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

// ���������� �������� � soludtionData ��� �������� �� ������� ���������� predicates.
function SetWidgetValueForPredicateArray(stepnum, predicates)
{
    for (var j in predicates)
    {
        // ������� ���� ([� � �] ��� [� � �]) - ������ �������� ����������
        if (predicates[j] != undefined && IsArray(predicates[j]))
        {
            for(var k in predicates[j])
            {
                SetWidgetValueForPredicate(stepnum, predicates[j][k]);
            }
        }
        else    // ������� ���� (� � � � � � �) - ������ ����������
        {
            SetWidgetValueForPredicate(stepnum, predicates[j]);
        }
    }
}

// ���������� � solutionData �������� �������, ��������� � �������� predicate �� ���� � ������� stepnum
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
