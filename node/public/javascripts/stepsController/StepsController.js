var userRegion = "";
function GetUserRegion()
{
    console.log("userRegion : " +  userRegion);

    if(userRegion == "")
        return "Москва";
    else
        return userRegion;
}

var previousStepId = null;
var currentStepId = null;

var stepsHistory = null;
var groups = []; //Список групп полей (шагов) для формы (из них будем вытягивать данные)
var currentCaseData;

var autoSaveTime = 2 * 1000;
var lastSaved;

function checkStepExists (step_id)
{
  for (key in solutionData.steps)
  {
    if (solutionData.steps[key].id == step_id)
      return true;
  }
  return false;
}

function ShowProperStep(direction)
{
  // direction = null;
  // if ( checkStepExists ( getPreviousStepId ( currentStepId ) ) )
  var stepToShowIndex = currentCaseData.GetStepIndexById (currentStepId);
  var stepToShow = $("#step_"+stepToShowIndex);

  if ( !checkStepExists(getPreviousStepId (currentStepId)) ) {
    stepToShow.find('button.prev_btn').attr('disabled','disabled');
  } else {
    stepToShow.find('button.prev_btn').removeAttr('disabled');
  }

  if (direction == null) {
    if(stepToShowIndex <= currentCaseData.GetNumberOfSteps()) { 
      $(".step:visible").hide();
      stepToShow.fadeToggle(300);//.toggleClass("isInvisible");
    }
  }
  else {
    var stepToHide = $(".step:visible");
    switch(direction) {
      case "backward":
        stepToShow.css('top','-100%').show();
        stepToHide.animate({top: '100%'}, 500, function(){
          $(this).hide();
        });
        stepToShow.animate({top: '0%'}, 500);
        break;
      case "forward":
        stepToShow.css('top','100%').show();
        stepToHide.animate({top: '-100%'}, 500, function(){
          $(this).hide();
        });
        stepToShow.animate({top: '0%'}, 500);
        break;
    }
  }  
}

function SaveFormData( curStep, nextStep, callback )
{
  for (key in stepsHistory)
  {
    if ( stepsHistory[key].id == nextStep )
    {
      if ( stepsHistory[key].id == curStep ) { alert('Error! Going to corrupt steps history'); break; }
      stepsHistory[key].prevStep = curStep;
      break;
    }
  }

  // [TODO] keep DRY
  var data = {};
  for(var i = 0 ; i < groups.length ; i++)
  {
      data[solutionData.steps[i].id] = {};
      for(var widg in groups[i])
      {
          // console.log(widg + " == " + groups[i][widg].getValue());
          data[solutionData.steps[i].id][widg] = groups[i][widg].getValue();
      }
  }

  $.ajax(
  {
      url: window.location.pathname + '/submitForm',
      type: 'POST',
      data: 'curStep=' + encodeURIComponent(curStep) + '&nextStep=' + encodeURIComponent(nextStep) + '&jsonData=' + encodeURIComponent($.toJSON(data)),
      success: function(res)
      {
          callback();
          lastSaved = new Date();
      },
      error: function(jqXHR, textStatus, errorThrown)
      {
          // [TODO]
      }
  });    
}

// We need this method for current document mechanism
function CollectFormData()
{
  var data = {};

  for(var i = 0 ; i < groups.length ; i++)
  {
      data[solutionData.steps[i].id] = {};
      for(var widg in groups[i])
      {
          if(typeof(groups[i][widg].getDocumentValue) != "undefined")
              var tmp = groups[i][widg].getDocumentValue();
          else
              var tmp = groups[i][widg].getValue();

          data[widg] = tmp;
      }
  }

  return data;
}

function NextStep() 
{
    if ($(".next_btn").attr("disabled")!="disabled")
    {
        //Производим валидацию шага

        step_index = currentCaseData.GetStepIndexById(currentStepId);
        SetWidgetValueForPredicatesOnStep(step_index);

        // Проверка введённых данных на пустые значения.
        var emptyWidgetCount = 0;   // Кол-во виджетов, от которых зависит переход на след. шаг, но которые при этом не заполнены.
        var emptyInputFailedMessage = "";
        
        // Поиск виджетов, от которых зависит переход на следующий шаг.
        var nextInfo = solutionData.steps[step_index].next;
        var nextPredicateWidgets = {"step_id" : [], "widget_id": []};
        SearchNextPredicateWidgets(nextInfo, nextPredicateWidgets);

        // Составление списка названий виджетов.
        for (i in nextPredicateWidgets.step_id)
        {
            if(nextPredicateWidgets.step_id[i] != undefined)
                var nextPredicateWidgetsStepId = nextPredicateWidgets.step_id[i];
            else
                var nextPredicateWidgetsStepId = step_index;
            
            var value = GetWidgetValue(nextPredicateWidgetsStepId, nextPredicateWidgets.widget_id[i]);

            if(value instanceof Object && value.value != undefined)
                value = value.value;

            if(value == undefined || (typeof(value) == "string" && value == ""))
            {
                var widgetInfo = GetWidgetById(solutionData, nextPredicateWidgetsStepId, nextPredicateWidgets.widget_id[i])
                if(widgetInfo != undefined)
                {
                    var widgetName = widgetInfo.label;
                    if(widgetName instanceof Object && widgetName.name != undefined)
                        widgetName = widgetName.name;
                    
                    if(emptyWidgetCount == 0)
                        emptyInputFailedMessage = "«" + widgetName + "»";
                    else emptyInputFailedMessage = emptyInputFailedMessage + ", «" + widgetName + "»";
                    
                    emptyWidgetCount++;
                }
            }
        }
        var emptyInputFailMessageContainer = $(".step:visible").find(".emptyInputFailMessage");
        if(emptyWidgetCount > 0)
        {
            emptyInputFailMessageContainer.text("");
            
            if(emptyWidgetCount == 1)
                emptyInputFailMessageContainer.text("Для перехода к следующему шагу необходимо указать данные в полe " + emptyInputFailedMessage);
            else emptyInputFailMessageContainer.text("Для перехода к следующему шагу необходимо указать данные в полях: " + emptyInputFailedMessage);
            
            // Если сообщение уже не показано, покажем его.
            if(!emptyInputFailMessageContainer.is(":visible"))
                emptyInputFailMessageContainer.show("slow");
        }
        else
        {
            emptyInputFailMessageContainer.hide("fast");
        }

        // Проверка введённых данных на валидность.
        var isValid = true;
        for(var widg in groups[step_index])
        {
            if(!groups[step_index][widg].validate()) 
            {
                isValid = false;
                break;
            }
        }

        var validationFailMessageContainer = $(".step:visible").find(".validationFailMessage");
        // Если всё ОК, ищем следующий шаг.
        if (isValid)
        {
            validationFailMessageContainer.hide("fast");
            
            // Если не заполнены поля, участвующие в расчёте предикатов перехода,
            // то не будем искать следующий шаг.
            if(emptyWidgetCount == 0)
                FindNextStep(step_index);
        }
        else // Иначе радуем пользователя сообщением о неправильном заполнении формы.
        {
            validationFailMessageContainer.show("slow");
        }
    }
}

function FindNextStep(step_index)
{
    //Собираем информацию о виджетах, необходимых для проверки предикатов
    var nextInfo = solutionData.steps[step_index].next;
    for (var i in nextInfo)
    {
        var sid = nextInfo[i].step_id;
        var wid = nextInfo[i].widget_id;
        if (wid != undefined)
        {
            SetWidgetValueForWidget(step_index, sid, wid);
        }
        
        SetWidgetValueForPredicateArray(step_index, nextInfo[i].predicates);
    }
    var nextStepId;
    if ( nextStepId = getNextStepId (currentStepId, nextInfo) ) 
    {      
  
        //Сохраняем на сервере введенные данные
        SaveFormData(currentStepId, nextStepId, function()
        {
            if (nextStepId == "endOfCase")
            {
                ShowEndCasePopup();
            }
            else
            {
                previousStepId = currentStepId;
                currentStepId = nextStepId;
                ShowProperStep("forward");
                OnWidgetChanged();
            }
        });
    }
}

function getNextStepId (stepId, nextInfo) 
{
  var newStepId;
  var step_index;
  for (i in nextInfo) 
  {
    newStepId = CheckNextInfo(nextInfo[i]);
    step_index=currentCaseData.GetStepIndexById(newStepId);
    if (solutionData.steps[step_index] !== undefined && solutionData.steps[step_index].id !== null || newStepId=="endOfCase") break;
  }
  if (solutionData.steps[step_index] !== undefined && solutionData.steps[step_index].id !== null || newStepId=="endOfCase")
  {
    return newStepId;
  }
  else 
  {
    alert('Next step not found');
    return undefined;
  }
}

// Проверить, выполняется ли условие nextInfo.
// Если выполняется, вернуть nextInfo.id.
// Иначе вернуть undefined.
function CheckNextInfo(nextInfo)
{
    var temporaryCurrentStep = currentCaseData.GetStepIndexById ( currentStepId );

    var sourceStep;
    if (nextInfo.type == "default") 
        return nextInfo.value;
        
    if (nextInfo.type == "list") 
    {
        if (nextInfo.step_id == undefined) 
            sourceStep = temporaryCurrentStep;
        else 
        {
            sourceStep = currentCaseData.GetStepIndexById(nextInfo.step_id);
            if (sourceStep < 0 && nextInfo.step_id != "endOfCase") 
            {
                return undefined;
            }
        }
        
        var value = GetWidgetValue(sourceStep, nextInfo.widget_id);
        var widgetInfo = currentCaseData.GetWidgetData(sourceStep, nextInfo.widget_id);
        if (widgetInfo == undefined) 
        {
            return undefined;
        }
        for (var i = 0; i < widgetInfo.value_list.length; i ++) 
        {
            if (widgetInfo.value_list[i].value == value) 
            {
                return nextInfo.next_list[i];
            }
        }
        
        return undefined;
    }
    else 
    {
        if (nextInfo.type == undefined) 
        {
            var formatOR = IsPredicateOfTypeOR(nextInfo.predicates);
        
            if(formatOR)
            {
                var check = false;
        
                for (var i in nextInfo.predicates)
                {
                    var check = true;
                    for (var j in nextInfo.predicates[i]) 
                    {
                        check = this.CheckPredicate(nextInfo.predicates[i][j]);
                        if (check == false) 
                            break;
                    }
                    
                    if(check == true)
                        return nextInfo.id;
                }
                
                return undefined;
            }
            else
            {
                var check = true;
                for (var j in nextInfo.predicates) 
                {
                    check = this.CheckPredicate(nextInfo.predicates[j]);
                    if (check == false) 
                    {
                        return undefined;
                    }
                }
            }
        }
        
        return nextInfo.id;
    }
}

function getPreviousStepId ( currentStepId )
{
  if ( stepsHistory !== null ) {
    for (var key in stepsHistory) {
      if (stepsHistory[key].id == currentStepId) {
        return stepsHistory[key].prevStep;
      }
    }
  }
  else return 0;
}

function PrevStep()
{
  $(".step:visible").find(".validationFailMessage").hide("fast"); 
  $(".step:visible").find(".emptyInputFailMessage").hide("fast");
        
  if ( checkStepExists ( getPreviousStepId ( currentStepId ) ) ) {
    previousStepId = getPreviousStepId ( currentStepId );
    currentStepId = previousStepId;
    previousStepId = getPreviousStepId ( currentStepId );
    
    //Сохраняем на сервере введенные данные
    SaveFormData( previousStepId, currentStepId, function(){
        ShowProperStep("backward");
        OnWidgetChanged();
    });    
  }
  else alert('Previous step doesn\'t exist');
}

function OnWidgetChanged()
{
    var stepnum = currentCaseData.GetStepIndexById(currentStepId);
    
    SetWidgetValueForPredicatesOnStep(stepnum);
    CountVisibility(stepnum);
    HideInvisible(stepnum);
    CheckButtonNext(stepnum);
}

function HideInvisible(stepnum)
{
  var tcs = stepnum;
      
  for (var i in solutionData.steps[tcs].widget_groups)
  {
        if (solutionData.steps[tcs].widget_groups[i].visible == false)
        {
            for (var j in solutionData.steps[tcs].widget_groups[i].widgets)
            {
                $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").hide();
            }
        }
        else
        {
            for (var j in solutionData.steps[tcs].widget_groups[i].widgets)
            {
                if (solutionData.steps[tcs].widget_groups[i].widgets[j].visible == false)
                {
                    $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").hide();
                }
                else
                {
                    $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").show();
                }
            }
        }
    }
    for (var i in solutionData.steps[tcs].widgets)
    {
        if (solutionData.steps[tcs].widgets[i].visible == false)
        {
            $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id + "_wrapper").hide();
        }
        else
        {
            $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id + "_wrapper").show();
        }
    }
}

function CheckButtonNext (stepnum)
{
    var nextInfo = solutionData.steps[stepnum].next;
    var endExists = false;
    var disableExists = false;
    for (var i in nextInfo)
    {
        if (nextInfo[i].id == "endOfCase")
            endExists = true;
        if (nextInfo[i].id == "disableNext")
            disableExists = true;
    }
    if (endExists == false)
    {
        $("#next_btn").text("Далее");
    }
    if (disableExists == false)
    {
        $("#next_btn").removeAttr("disabled");
    }
    else
    {
        var nextInfo = solutionData.steps[stepnum].next;
        var end = false;
        var dis = false;
        for (var i in nextInfo)
        {
            if (nextInfo[i].id == "endOfCase" || nextInfo[i].id == "disableNext")
            {
                var sid = nextInfo[i].step_id;
                var wid = nextInfo[i].widget_id;
                if (wid != undefined)
                {
                    SetWidgetValueForWidget(stepnum, sid, wid);
                }
                
                for (var j in nextInfo[i].predicates)
                {
                    SetWidgetValueForPredicate(stepnum, nextInfo[i].predicates[j]);
                }
                
                if (nextInfo[i].type == undefined) 
                {
                    if (nextInfo[i].id == "endOfCase")
                    {
                        var check = true;
                        for (var j in nextInfo[i].predicates) 
                        {
                            check = this.CheckPredicate(nextInfo[i].predicates[j]);
                            if (check == false) 
                            {
                                break;
                            }
                        }
                        if (check == true)
                        {
                            end = true;
                        }
                    }
                    if (nextInfo[i].id == "disableNext")
                    {
                        var check = true;
                        for (var j in nextInfo[i].predicates)
                        {
                            check = this.CheckPredicate(nextInfo[i].predicates[j]);
                            if (check == false)
                                break;
                        }
                        if (check == true)
                            dis = true;
                    }  
                }
            }
        }
        if (end == true)
        {
           $("#next_btn").text("Завершить");
        }
        else
        {
           $("#next_btn").text("Далее");
        }
        if (dis == true)
        {
            $("#next_btn").attr("disabled", "disabled");
        }
        else
        {
            $("#next_btn").removeAttr("disabled");
        }
    }
}

function Save()
{
  previousStepId = getPreviousStepId ( currentStepId );
  SaveFormData( previousStepId, currentStepId, function() {} );
}

function AutoSave()
{
  previousStepId = getPreviousStepId ( currentStepId );
  SaveFormData( previousStepId, currentStepId, function() { setTimeout(AutoSave, autoSaveTime); } );  
}

// Проверяет, что объект является массивом
function IsArray (obj)
{
    return (typeof obj == "object") && (obj instanceof Array);
}

$(document).ready(function() {

  if (currentStepId == null) {
    currentStepId = solutionData.steps[0].id;
    alert('currentStepId = null');
  } 
  currentCaseData = new CaseDataController(solutionData);
  
  previousStepId=getPreviousStepId(currentStepId);

  ShowProperStep();
    
  setTimeout(AutoSave, autoSaveTime);  
  window.onbeforeunload = Save();

  OnWidgetChanged();
});


