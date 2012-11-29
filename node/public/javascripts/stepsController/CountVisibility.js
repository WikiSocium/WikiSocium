// ����� ������ ��� ��������� ��������� �������� � ����������� �� �������� ��������.

// ��������� � ��� ������������� �������� ��������� ����� �������� � ��������� �������� �� ���� � ������� stepnum
function CountVisibility(stepnum)
{
    var tcp = solutionData.steps[stepnum];
    
    // ��������� ����� ��������
    for (var i in tcp.widget_groups)
    {
        var group = tcp.widget_groups[i];
        
        // ��������� ���� ������
        CountObjectVisibility(group);
        
        // ��������� ��������� �������� ������ ������
        if (group.visible == true)
        {
            for (var i in group.widgets)
            {
                var w = group.widgets[i];
                CountObjectVisibility(w);
            }
        }
    }
    
    // ��������� ������� �������� (�� �������� � ������ ��� ���� ������ �� ������)
    for (var i in tcp.widgets)
    {
        var widget = tcp.widgets[i];
        CountObjectVisibility(widget);
    }
}

// ����� ��������� ��� ������� ����������.
// ���������� true, ���� �������� ����� ��� ������� �������� ���������� [[� � �] ��� [� � �]]
// � false, ���� �������� ����� ��� ������� ���������� [� � � � �]
function IsPredicateOfTypeOR(predicates)
{
    var formatOR = false;
    if(IsArray(predicates))
        if(IsArray(predicates[0]))
            formatOR = true;
    return formatOR;
}

// ��������� � ��� ������������� �������� ��������� ��������� ������� obj.
// �� ����� ������ obj � ������ isVisible (��������� ���������) � visible (������, �����/�� �����).
// ������ �� ����������.
function CountObjectVisibility(obj)
{
    // ���� ��������� �� ������ ��� ������������ ����� ������, �� ������ ����� � ���
    if (obj.isVisible == undefined || obj.isVisible == "true")
        obj.visible = true;
    // ���� �������� ������������ ����� ���, ������ ����������� �������
    else if (obj.isVisible == "false")
        obj.visible = false;
    else // � ��������� ������ ����� ��������� ���������
    {
        var resultVisible = true;
        
        // ����������� ��������� ������ ������ ���������
        var formatOR = IsPredicateOfTypeOR(obj.isVisible.predicates);
        
        // ������� ������������ ����� ������ �������� ����������.
        // ������� ���������� ���������� ���������� ��������� ���, ��������� ���������� ���������� ��������� �.
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
        else    // ������� ������������ ����� ������ ����������, ����������� ���������� ��������� �
        {
            resultVisible = true;
            
            // ������ �� ������� ����������
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
    // �������� Id ���� �� ������� ��������� ������, �������� �������� ������������� � ���������
    var sourceStep = currentCaseData.GetStepIndexById(predicate.step_id);
    
    // ���� Id ����������, �� ����� ������ ������� �����
    if (sourceStep == undefined || sourceStep < 0)
    {
        currentVisibility = false;
    }
    else // ����� ��������� ��������. ��������� ���������� ���������� ��������� �.
    {
        currentVisibility = currentVisibility && CheckPredicate(predicate, sourceStep);
    }
    
    return currentVisibility;
}

// ��������� ���������� 1 ���������
// �� ����� 1 ��������
// �� ������ bool
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