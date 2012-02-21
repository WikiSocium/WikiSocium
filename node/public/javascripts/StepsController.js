//
// [TODO] Это все надо оформить в виде объекта StepsController, чтобы методы не "висели" в воздухе
//
YUI_config.groups.inputex.base = '../../inputex/build/';

// [TODO] Этой переменной не будет, вместо нее будет обращение к динамическому объекту, синхронизирующемуся с серверу
var temporaryCurrentStep = 0;
var previousStep = 0;
var stepsHistory = null;
var groups = []; //Список групп полей (шагов) для формы (из них будем вытягивать данные)
var currentCaseData;

function checkStepExists ( step_id ) {
  for (key in solutionData.steps) {
    if ( solutionData.steps[key].id == step_id ) return true;
  }
  return false;
}

function ShowProperStep()
{
  if(temporaryCurrentStep <= currentCaseData.GetNumberOfSteps()) {
    $(".step").hide();//.addClass("isInvisible");
    $("#"+"step_"+temporaryCurrentStep).fadeToggle(300);//toggleClass("isInvisible");
    for (i in solutionData.steps[temporaryCurrentStep].widget_groups)
    {
    	if (solutionData.steps[temporaryCurrentStep].widget_groups[i].visible==false)
    	{
    		for (j in solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets)
    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).hide();
    	}
    	else
    	{
    		for (j in solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets)
    		{
    			if (solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].visible==false)
	    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).hide();
	    		else
	    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).show();
	   		}
	   	}
    }
    for (i in solutionData.steps[temporaryCurrentStep].widgets)
    {
    	if (solutionData.steps[temporaryCurrentStep].widgets[i].visible==false)
    		$("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widgets[i].id).hide();
   		else
		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widgets[j].id).show();
    }
  }
  
  if(temporaryCurrentStep >= currentCaseData.GetNumberOfSteps()) //Последний шаг
    {
      YUI().use('inputex', 'inputex-button', 'inputex-group', 'json-stringify', function(Y) {
        var destroyButton = new Y.inputEx.widget.Button({
          parentEl: 'stepsWrapper',
          id: 'submitForm',
          type: 'submit',
          value: 'Submit the form',
          onClick: function(){
            SaveFormData();
          }
        });
      });
    }
    
    //Набросок альтернативного варианта показа шагов (с багами, надо дописывать)
    /*YUI().use('inputex-string', 'inputex-form', 'inputex-datepicker', 'inputex-timeinterval', 'inputex-group', function(Y) {
     *      if(temporaryCurrentStep > 0)
     *      {
     *        groups[temporaryCurrentStep - 1].hide();
     *        groups[temporaryCurrentStep].show();
     }
     });*/
}
     
function SaveFormData( curStep, nextStep )
{
  var formData = CollectFormData();
  
  $.ajax({
    url: window.location.pathname + '/submitForm'
    , type:'POST'
    , data: 'curStep=' + curStep + '&nextStep=' + nextStep + '&jsonData=' + $.toJSON(formData)
    , success: function(res) {}
  });    
}

function CollectWidgetData(step_index, widget_id)
{
  var data;
  YUI().use('inputex', function(Y)
  {
    if ((step_index < 0) || (step_index >= groups.length)) {
      data = undefined;
    }
    data = groups[step_index][widget_id].getValue();
  });
  return data;
}

function CollectFormData()
{
  var data = new Array();
  YUI().use('inputex', function(Y) 
  {
    for(var i = 0 ; i < groups.length ; i++)
    {
      data[i] = new Object();
      for(var widg in groups[i])
        data[i][widg] = groups[i][widg].getValue();
    }
  });
  return data;
}

//Валидация всех виджетов на шаге
function ValidateStep(step_index)
{
  var isValid = true;
  YUI().use('inputex', function(Y) 
  {
    for(var widg in groups[step_index])
      if(!groups[step_index][widg].validate()) {
        isValid = false; break;
      }
  });
  return isValid;    
}

// Обработчик нажатия кнопки следующего шага
function CheckPredicate(predicate, step_index) {
  var value = CollectWidgetData(step_index, predicate.widget_id);
  
  if (typeof value === "undefined") {
    return false;
  }
  
  switch(predicate.cond) {
    case "==":	return (value == predicate.value);
    case "!=":	return (value != predicate.value);
    case "<=":	return (value <= predicate.value);
    case ">=":	return (value >= predicate.value);
    case ">":	return (value > predicate.value);
    case "<":	return (value < predicate.value);
    default:	return false;
  }
}

function CheckNextInfo(nextInfo)
{
  var sourceStep;
  if (nextInfo.type == "default") {
    return currentCaseData.GetStepIndexById(nextInfo.value);
  }
  if (nextInfo.type == "list") {
    if (nextInfo.step_id == undefined) {
      sourceStep = temporaryCurrentStep;
    }
    
    else {
      sourceStep = currentCaseData.GetStepIndexById(nextInfo.step_id);
      if (sourceStep < 0) {
        return -1;
      }
    }
    var value = CollectWidgetData(sourceStep, nextInfo.widget_id);
    var radioWidgetInfo = currentCaseData.GetWidgetData(sourceStep, nextInfo.widget_id);
    if (radioWidgetInfo == undefined) {
      return -1;
    }
    for (var i = 0; i < radioWidgetInfo.value_list.length; i ++) {
      if (radioWidgetInfo.value_list[i].value == value) {
        return currentCaseData.GetStepIndexById(nextInfo.next_list[i]);
      }
    }
    return -1;
  }
  else if (nextInfo.type == undefined) {
    var check = false;
    for (j in nextInfo.predicates) {
      if (nextInfo.predicates[j].step_id == undefined) {
        sourceStep = temporaryCurrentStep;
      } else {
        sourceStep = currentCaseData.GetStepIndexById(nextInfo.predicates[j].step_id);
      }
      if (sourceStep < 0) {
        return -1;
      }
      check = this.CheckPredicate(nextInfo.predicates[j], sourceStep);
      if (check == false) {
        return -1;
      }
    }
    return currentCaseData.GetStepIndexById(nextInfo.id);
  }
}

function ShowEndCasePopup()
{
  $("#endCasePopup").fadeIn(100);
}

function HideEndCasePopup()
{
  $("#endCasePopup").fadeOut(100);
}

function EndCasePopupSelectionChanged()
{
  $("#endCase1").toggle();
  $("#endCase2").toggle();
}

function getPreviousStep ( currentStep ) {
  if ( stepsHistory !== null ) {
    for (var key in stepsHistory) {
      if (stepsHistory[key].id == temporaryCurrentStep) {
        return stepsHistory[key].prevStep;
      }
    }
  }
  else return 0;
}

function PrevStep() {

  if ( checkStepExists ( previousStep ) ) {
    temporaryCurrentStep = previousStep;
    previousStep = getPreviousStep ( temporaryCurrentStep );
    
    //Сохраняем на сервере введенные данные
    SaveFormData( previousStep, temporaryCurrentStep );
    
    CheckWidgetsVisibility(temporaryCurrentStep);
    
    ShowProperStep();
  }
}

function NextStep() {
  $("#validationFailedMessage").hide("fast");  
 
  //Если они верны, то переходим на один из следующих шагов
  if(ValidateStep(temporaryCurrentStep)) {
    var nextInfo = solutionData.steps[temporaryCurrentStep].next;
    var tmp = -1;
    previousStep = temporaryCurrentStep;
    if (nextInfo == undefined) {
      temporaryCurrentStep += 1;
    }
    else {
      for (i in nextInfo) {
        tmp = CheckNextInfo(nextInfo[i]);	
        if (tmp > 0) {
          temporaryCurrentStep = tmp;
          break;
        }
      }
    }
        
    //Сохраняем на сервере введенные данные
    SaveFormData( previousStep, temporaryCurrentStep );
    
    CheckWidgetsVisibility(temporaryCurrentStep);
    
    ShowProperStep();
  }
  else //Радуем пользователя сообщением о неправильном заполнении формы
  {
    $("#validationFailedMessage").show("slow");
  }
}

function CheckWidgetsVisibility (stepnum)
{
    var tcp=solutionData.steps[stepnum];
    
   	for (i in tcp.widget_groups)
   	{
   		var gr=tcp.widget_groups[i];
   		if (gr.isVisible == undefined || gr.isVisible=="true")
   			gr.visible=true;
    	else
    	{
    		if (gr.isVisible == "false")
    			gr.visible=false;
    		else
    		{
    		    gr.visible = false;
			    for (j in gr.isVisible.predicates)
			    {
			        sourceStep = currentCaseData.GetStepIndexById(gr.isVisible.predicates[j].step_id);
			        if (sourceStep==undefined || sourceStep < 0) {    return -1;   }
      				gr.visible = this.CheckPredicate(gr.isVisible.predicates[j], sourceStep);
				    if (gr.visible==false) { return -1; }
    			}
    		}    		
    	}
    	if (gr.visible==true)
    	{
    		for (j in gr.widgets)
    		{
    			var w=gr.widgets[j];
    			if (w.isVisible==undefined || w.isVisible=="true")
    				w.visible=true;
				else
				{
					if (w.isVisible=="false")
						w.visible=false;
					else
					{
						w.visible=false;
						for (k in w.isVisible.predicates)
						{
					        sourceStep = currentCaseData.GetStepIndexById(w.isVisible.predicates[k].step_id);
					        if (sourceStep==undefined || sourceStep < 0) {    return -1;   }
      						w.visible = this.CheckPredicate(w.isVisible.predicates[k], sourceStep);
						    if (w.visible==false) { return -1; }
						}
					}
    			}
    		}    		
    	}
    }
    
    for (i in tcp.widgets)
    {
    	var w=tcp.widgets[i];
		if (w.isVisible==undefined || w.isVisible=="true")
			w.visible=true;
		else
		{
			if (w.isVisible=="false")
				w.visible=false;
			else
			{
				w.visible=false;
				for (k in w.isVisible.predicates)
				{
			        sourceStep = currentCaseData.GetStepIndexById(w.isVisible.predicates[k].step_id);
			        if (sourceStep==undefined || sourceStep < 0) {    return -1;   }
					w.visible = this.CheckPredicate(w.isVisible.predicates[k], sourceStep);
				    if (w.visible==false) { return -1; }
				}
			}
		}
    }
}

function SaveAndExit() {
  SaveFormData( previousStep, temporaryCurrentStep );
  window.location = '/mycases';
}

function GoBack()
{
  temporaryCurrentStep = previousStep;
  ShowProperStep();
}

$(document).ready(function()
{
  // Все шаги сейчас скрыты, нужно показать выбранный
  if (temporaryCurrentStep==undefined) temporaryCurrentStep=0;
  
  currentCaseData = new CaseDataController(solutionData);
  
  CheckWidgetsVisibility(temporaryCurrentStep);
  ShowProperStep();    
});
