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
        else
        {
            for (var i in group.widgets)
                group.widgets[i].visible = false;
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
    // var resultVisible = true;
          
    // ���� ��������� �� ������ ��� ������������ ����� ������, �� ������ ����� � ���
    // typeof obj.isVisible == 'undefined' || 
    if (obj.isVisible == "true")
    {
        obj.visible = true;
    }
    // ���� �������� ������������ ����� ���, ������ ����������� �������
    else if (obj.isVisible == "false")
    {
        obj.visible = false;
    }
    else // � ��������� ������ ����� ��������� ���������
    {
        resultVisible = true;
        
        if(typeof obj.isVisible != 'undefined')
          var predicatesArray = obj.isVisible.predicates;
        else
          var predicatesArray = obj.predicates;
          
        if(typeof predicatesArray == 'undefined')
        {
          obj.visible = true;
          return true;
        }
        
        // ����������� ��������� ������ ������ ���������
        var formatOR = IsPredicateOfTypeOR(predicatesArray);
        
        // ������� ������������ ����� ������ �������� ����������.
        // ������� ���������� ���������� ���������� ��������� ���, ��������� ���������� ���������� ��������� �.
        if(formatOR)
        {
            resultVisible = false;
        
            for (var j in predicatesArray)
            {
                var massVisible = true;
                for(var k in predicatesArray[j])
                {
                    massVisible = CheckPredicateAndUpdateVisibility(predicatesArray[j][k], massVisible);
                }
                
                resultVisible = resultVisible || massVisible;
            }
        }
        else    // ������� ������������ ����� ������ ����������, ����������� ���������� ��������� �
        {
            resultVisible = true;
            
            // ������ �� ������� ����������
            for (var k in predicatesArray)
            {
                resultVisible = CheckPredicateAndUpdateVisibility(predicatesArray[k], resultVisible);
            }
        }
        
        obj.visible = resultVisible;
    }
    return obj.visible;
}

function CheckPredicateAndUpdateVisibility(predicate, currentVisibility)
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
        // console.log("predicate:");
        // console.log(predicate);
        currentVisibility = currentVisibility && CheckPredicate(predicate);
    }
    
    return currentVisibility;
}

function CheckGroupPredicatesForWidget(stepnum, wid)
{  
  // var tcp = solutionData.steps[stepnum];
 
   // looks like incorrect tcp returned
  console.log("CheckGroupPredicatesForWidget: " + stepnum + ", " + wid);
  
  for (var sn in solutionData.steps)
  {
    var tcp = solutionData.steps[sn];
    for (var i in tcp.widget_groups)
    {
        var group = tcp.widget_groups[i];      
        for (var i in group.widgets)
        {
            if(group.widgets[i].id == wid)
            {
              var groupVisibility = CountObjectVisibility(group);              
              console.log("group visibility for " + wid + " = " + groupVisibility);        
              return groupVisibility;
            }
        }
    }
  }  
  return true;
}

// ��������� ���������� 1 ���������
// �� ����� 1 ��������
// �� ������ bool
function CheckPredicate(predicate) 
{
    var value;
    if (typeof predicate.step_id != 'undefined')
    {
        if(!CheckGroupPredicatesForWidget(predicate.step_id, predicate.widget_id))
          return false;
        
        value = GetWidgetValue(currentCaseData.GetStepIndexById(predicate.step_id), predicate.widget_id);
    }
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