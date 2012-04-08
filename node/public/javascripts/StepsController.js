//
// [TODO] Это все надо оформить в виде объекта StepsController, чтобы методы не "висели" в воздухе
//
YUI_config.groups.inputex.base = '../../inputex/build/';

var previousStepId = null;
var currentStepId = null;

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
  var temporaryCurrentStep = currentCaseData.GetStepIndexById ( currentStepId );
  if(temporaryCurrentStep <= currentCaseData.GetNumberOfSteps()) {
    $(".step").hide().toggleClass("isInvisible");
    $("#"+"step_"+temporaryCurrentStep).fadeToggle(300);//.toggleClass("isInvisible");
    for (i in solutionData.steps[temporaryCurrentStep].widget_groups)
    {
    	if (solutionData.steps[temporaryCurrentStep].widget_groups[i].visible==false)
    	{
    		for (j in solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets)
    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).hide().toggleClass("isInvisible");
    	}
    	else
    	{
    		for (j in solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets)
    		{
    			if (solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].visible==false)
	    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).hide().toggleClass("isInvisible");
	    		else
	    		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widget_groups[i].widgets[j].id).show().toggleClass("isInvisible");
	   		}
	   	}
    }
    for (i in solutionData.steps[temporaryCurrentStep].widgets)
    {
    	if (solutionData.steps[temporaryCurrentStep].widgets[i].visible==false)
    		$("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widgets[i].id).hide().toggleClass("isInvisible");
   		else
		   $("#"+"step_"+temporaryCurrentStep+"_widget_"+solutionData.steps[temporaryCurrentStep].widgets[i].id).show().toggleClass("isInvisible");
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
     
function SaveFormData( curStep, nextStep, callback ) {

  for (key in stepsHistory) {
    if ( stepsHistory[key].id == nextStep ) {
      stepsHistory[key].prevStep = curStep;
      break;
    }
  }

  var formData = CollectFormData();

  $.ajax({
    url: window.location.pathname + '/submitForm'
    , type:'POST'
    , data: 'curStep=' + encodeURIComponent(curStep) + '&nextStep=' + encodeURIComponent(nextStep) + '&jsonData=' + encodeURIComponent($.toJSON(formData))
    , success: function(res) {
            callback();
		}
	, error: function(jqXHR, textStatus, errorThrown) {
	        // [TODO]
        }
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
function ValidateStep(step_id)
{
  step_index = currentCaseData.GetStepIndexById(step_id);
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
  var temporaryCurrentStep = currentCaseData.GetStepIndexById ( currentStepId );
  
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
  var modal_title = "Завершение дела";
  var buttons = [];
  buttons.push(new modalButton ( "Отменить", function() { $( this ).dialog( "close" ); } ) );
  buttons.push(new modalButton ( "Завершить", function() { $( "#endCaseForm" ).submit(); } ) );
  showModalWindow ( modal_title, "", buttons, 550, 320, "endCasePopup" );
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

function getPreviousStepId ( currentStepId ) {
  if ( stepsHistory !== null ) {
    for (var key in stepsHistory) {
      if (stepsHistory[key].id == currentStepId) {
        return stepsHistory[key].prevStep;
      }
    }
  }
  else return 0;
}

function PrevStep() {

  if ( checkStepExists ( getPreviousStepId ( currentStepId ) ) ) {
    previousStepId = getPreviousStepId ( currentStepId );
    currentStepId = previousStepId;
    previousStepId = getPreviousStepId ( currentStepId );
    
    //Сохраняем на сервере введенные данные
    SaveFormData( previousStepId, currentStepId, function(){
        CheckWidgetsVisibility( currentCaseData.GetStepIndexById(currentStepId) );
        ShowProperStep();
    });    
  }
  else alert('Previous step doesn\'t exist');
}

function getNextStepId (stepId) {
  var step_index;
  var nextInfo = solutionData.steps[currentCaseData.GetStepIndexById(stepId)].next;
  for (i in nextInfo) {
    step_index = CheckNextInfo(nextInfo[i]);	
    if ( solutionData.steps[step_index] !== undefined && solutionData.steps[step_index].id !== null ) break;
  }
  if ( solutionData.steps[step_index] !== undefined && solutionData.steps[step_index].id !== null ) {
    return solutionData.steps[step_index].id;
  }
  else {
    alert('Next step not found');
    return false;
  }
}

function NextStep() {
  $("#validationFailedMessage").hide("fast");  
 
  //Если они верны, то переходим на один из следующих шагов
  if(ValidateStep(currentStepId)) {    
    var nextStepId;
    if ( nextStepId = getNextStepId (currentStepId) ) {      
      
      previousStepId = currentStepId;      
      currentStepId = nextStepId;
      
      //Сохраняем на сервере введенные данные
      SaveFormData( previousStepId, currentStepId, function(){
            CheckWidgetsVisibility( currentCaseData.GetStepIndexById(currentStepId) );
            ShowProperStep();
      });
    }
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
    		    gr.visible = true;
			    for (j in gr.isVisible.predicates)
			    {
			        sourceStep = currentCaseData.GetStepIndexById(gr.isVisible.predicates[j].step_id);
			        if (sourceStep==undefined || sourceStep < 0) { gr.visible=false; }
                    else
                    {
      				   gr.visible = gr.visible && this.CheckPredicate(gr.isVisible.predicates[j], sourceStep);
				    }
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
						w.visible=true;
						for (k in w.isVisible.predicates)
						{
					        sourceStep = currentCaseData.GetStepIndexById(w.isVisible.predicates[k].step_id);
					        if (sourceStep==undefined || sourceStep < 0) { w.visible=false; }
					        else
					        {
      						   w.visible = w.visible && this.CheckPredicate(w.isVisible.predicates[k], sourceStep);
						    }
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
				w.visible=true;
				for (k in w.isVisible.predicates)
				{
			        sourceStep = currentCaseData.GetStepIndexById(w.isVisible.predicates[k].step_id);
			        if (sourceStep==undefined || sourceStep < 0) { w.visible=false; }
			        else
			        {
					   w.visible = w.visible && this.CheckPredicate(w.isVisible.predicates[k], sourceStep);
					}
				}
			}
		}
    }
}

function OnWidgetChanged()
{
  previousStepId=getPreviousStepId(currentStepId);
  SaveFormData (previousStepId, currentStepId, function()
  {
  CheckWidgetsVisibility( currentCaseData.GetStepIndexById(currentStepId) );
  
  var tcs=currentCaseData.GetStepIndexById(currentStepId)
      
  for (i in solutionData.steps[tcs].widget_groups)
  {
    	if (solutionData.steps[tcs].widget_groups[i].visible==false)
    	{
    		for (j in solutionData.steps[tcs].widget_groups[i].widgets)
    		   $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id).hide();
    	}
    	else
    	{
    		for (j in solutionData.steps[tcs].widget_groups[i].widgets)
    		{
    			if (solutionData.steps[tcs].widget_groups[i].widgets[j].visible==false)
	    		   $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id).hide();
	    		else
	    		   $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id).show();
	   		}
	   	}
    }
    for (i in solutionData.steps[tcs].widgets)
    {
    	if (solutionData.steps[tcs].widgets[i].visible==false)
    	{
    		$("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id).hide();
    	}
   		else
   		{
		   $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id).show();
		}
    }
	});
}

function SaveAndExit() {
  previousStepId = getPreviousStepId ( currentStepId );
  SaveFormData( previousStepId, currentStepId, function() { window.location = '/mycases'; } );
}

var autoSaveTime = 2 * 1000; 
function AutoSave() {
  previousStepId = getPreviousStepId ( currentStepId );
  SaveFormData( previousStepId, currentStepId, function() { setTimeout(AutoSave, autoSaveTime); } );
}

/*
function GoBack()
{
  temporaryCurrentStep = previousStep;
  ShowProperStep();
}
*/

$(document).ready(function() {

  if (currentStepId == null) {
    currentStepId = solutionData.steps[0].id;
    alert('currentStepId = null');
  } 
  currentCaseData = new CaseDataController(solutionData);
  
  CheckWidgetsVisibility(currentCaseData.GetStepIndexById(currentStepId));
  ShowProperStep();
    
  setTimeout(AutoSave, autoSaveTime);
});
