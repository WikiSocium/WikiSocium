YUI_config.groups.inputex.base = '../../inputex/build/';

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

function checkStepExists ( step_id ) {
  for (key in solutionData.steps) {
    if ( solutionData.steps[key].id == step_id ) return true;
  }
  return false;
}

function ShowProperStep()
{
    var temporaryCurrentStep = currentCaseData.GetStepIndexById ( currentStepId );
    if(temporaryCurrentStep <= currentCaseData.GetNumberOfSteps()) 
    { 
        $(".step").hide().toggleClass("isInvisible");
        $("#"+"step_"+temporaryCurrentStep).fadeToggle(300);//.toggleClass("isInvisible");
    }
 
  if(temporaryCurrentStep >= currentCaseData.GetNumberOfSteps()) //Последний шаг
  {
    YUI().use('inputex', 'inputex-button', 'inputex-group', 'json-stringify', function(Y) 
    {
        var destroyButton = new Y.inputEx.widget.Button(
        {
          parentEl: 'stepsWrapper',
          id: 'submitForm',
          type: 'submit',
          value: 'Submit the form',
          onClick: function()
          {
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
  for (key in stepsHistory) 
  {
    if ( stepsHistory[key].id == nextStep ) 
    {
      stepsHistory[key].prevStep = curStep;
      break;
    }
  }

  YUI().use('inputex', function(Y) 
  {
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
        success: function(res) {
            callback();
            lastSaved = new Date();
        },
        error: function(jqXHR, textStatus, errorThrown) {
	        // [TODO]
        }
    });    

  });
}

function CheckPredicate(predicate) 
{
    var value;
    if (predicate.step_id!=undefined)
        value=GetWidgetValue(currentCaseData.GetStepIndexById(predicate.step_id), predicate.widget_id);
    else
        value=GetWidgetValue(currentCaseData.GetStepIndexById(currentStepId), predicate.widget_id);
        
    if (typeof value == "undefined") 
    { 
        return false;
    }

    if(typeof(value) != "string")
      value = value.value;
  
    switch(predicate.cond) 
    {
        case "==":	return (value == predicate.value);
        case "!=":	return (value != predicate.value);
        case "<=":	return (value <= predicate.value);
        case ">=":	return (value >= predicate.value);
        case ">":	return (value > predicate.value);
        case "<":	return (value < predicate.value);
        default:	return false;
    }
}

function NextStep() 
{
  if ($("#next_btn").attr("disabled")!="disabled")
  {
      $("#validationFailedMessage").hide("fast"); 
    
      //Производим валидацию шага
      
      YUI().use('inputex', function(Y) 
      {
          step_index = currentCaseData.GetStepIndexById(currentStepId);
          var isValid = true;
          
        for(var widg in groups[step_index])
        {
            if(!groups[step_index][widg].validate()) 
            {
                isValid = false; break;
            }
        }
        if (isValid) FindNextStep(step_index);
        else //Радуем пользователя сообщением о неправильном заполнении формы
        {
            $("#validationFailedMessage").show("slow");
        }
      });
  }
} 

function SetWidgetValue (sn, wid, data)
{
    var st=solutionData.steps[sn];

    for (var i in st.widgets)
    {
        if (st.widgets[i].id==wid)
            st.widgets[i].widget_value=data; 
    }
    for (var i in st.widget_groups)
    {
        for (var j in st.widget_groups[i].widgets)
        {
            if (st.widget_groups[i].widgets[j].id==wid)
                st.widget_groups[i].widgets[j].widget_value=data;
        }
    }
}

function GetWidgetValue (sn, wid)
{
    var st=solutionData.steps[sn];
    var value="undefined";
    
    for (var i in st.widgets)
    {
        var w=st.widgets[i];
        if (w.id==wid)
            value=w.widget_value;
    }
    
    for (var i in st.widget_groups)
    {
        var wg=st.widget_groups[i];
        for (var j in wg.widgets)
        {
            var w=wg.widgets[j];
            if (w.id==wid)
                value=w.widget_value;
        }
    }

    return value;
}
 
function FindNextStep(step_index)
{
  //Собираем информацию о виджетах, необходимых для проверки предикатов
  YUI().use('inputex', function(Y)
  {
    var nextInfo = solutionData.steps[step_index].next;
    for (var i in nextInfo)
    {
        var sid=nextInfo[i].step_id;
        var wid=nextInfo[i].widget_id;
        if (wid!=undefined)
        {
            var sn;
            if (sid==undefined) sn=step_index;
            else sn=currentCaseData.GetStepIndexById(sid);
            var data;
            if ((sn < 0) || (sn >= groups.length)) 
            {
                data = undefined;
            }
            data = groups[sn][wid].getValue();
            SetWidgetValue(sn, wid, data);
        }
        for (var j in nextInfo[i].predicates)
        {
            var sid=nextInfo[i].predicates[j].step_id;
            var sn;
            if (sid==undefined) sn=step_index;
            else sn=currentCaseData.GetStepIndexById(sid);
            var wid=nextInfo[i].predicates[j].widget_id;
            var data;
            if ((sn < 0) || (sn >= groups.length)) 
            {
                data = undefined;
            }
            data = groups[sn][wid].getValue();
            SetWidgetValue(sn, wid, data);
        }
    }
    var nextStepId;
    if ( nextStepId = getNextStepId (currentStepId, nextInfo) ) 
    {      
  
        //Сохраняем на сервере введенные данные
        SaveFormData( currentStepId, nextStepId, function()
        {
            if (nextStepId=="endOfCase")
            {
                ShowEndCasePopup();
            }
            else
            {
                previousStepId = currentStepId;      
                currentStepId = nextStepId;
                ShowProperStep();
                CheckWidgetsVisibilityAndNextText( currentCaseData.GetStepIndexById(currentStepId) );
            }
        });
    }
  } ); 
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

function CheckNextInfo(nextInfo)
{
  var temporaryCurrentStep = currentCaseData.GetStepIndexById ( currentStepId );
  
  var sourceStep;
  if (nextInfo.type == "default") 
  {
    return nextInfo.value;
  }
  if (nextInfo.type == "list") 
  {
    if (nextInfo.step_id == undefined) 
    {
        sourceStep = temporaryCurrentStep;
    }    
    else 
    {
      sourceStep = currentCaseData.GetStepIndexById(nextInfo.step_id);
      if (sourceStep < 0 && nextInfo.step_id!="endOfCase") 
      {
        return undefined;
      }
    }
    var value = GetWidgetValue(sourceStep, nextInfo.widget_id);
    var radioWidgetInfo = currentCaseData.GetWidgetData(sourceStep, nextInfo.widget_id);
    if (radioWidgetInfo == undefined) 
    {
        return undefined;
    }
    for (var i = 0; i < radioWidgetInfo.value_list.length; i ++) 
    {
        if (radioWidgetInfo.value_list[i].value == value) 
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
    return nextInfo.id;
  }
}

function ShowEndCasePopup()
{
  var modal_title = "Завершение дела";
  var buttons = [];
  buttons.push(new modalButton ( "Отменить", 'cancel' ) );
  buttons.push(new modalButton ( "Завершить", function() { $( "#endCaseForm" ).submit(); } ) );
  showModalWindow ( modal_title, "", buttons, "endCasePopup" );
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
        ShowProperStep();
        CheckWidgetsVisibilityAndNextText( currentCaseData.GetStepIndexById(currentStepId) );
    });    
  }
  else alert('Previous step doesn\'t exist');
}

function OnWidgetChanged()
{
    CheckWidgetsVisibilityAndNextText( currentCaseData.GetStepIndexById(currentStepId) );
}

function CheckWidgetsVisibilityAndNextText (stepnum)
{
   
    //собираем информацию о виджетах, которые должны быть использованы в предикатах видимости
    YUI().use('inputex', function(Y)
    {
        var tcp=solutionData.steps[stepnum];

        if (tcp.widgets!=undefined)
        {
            for (var i in tcp.widgets)
            {
                var iv=tcp.widgets[i].isVisible;
                if (iv!=undefined)
                {
                    if (iv.predicates!=undefined)
                    {
                        for (var j in iv.predicates)
                        {
                            var sid=iv.predicates[j].step_id;
                            var sn;
                            if (sid==undefined) sn=stepnum;
                            else sn=currentCaseData.GetStepIndexById(sid);
                            var wid=iv.predicates[j].widget_id;
                            var data;
                            if ((sn < 0) || (sn >= groups.length)) 
                            {
                                data = undefined;
                            }
                            data = groups[sn][wid].getValue();
                            SetWidgetValue(sn, wid, data);
                        }
                    }
                }
            }
        }
        if (tcp.widget_groups!=undefined)
        {
            for (var i in tcp.widget_groups)
            {
                var iv=tcp.widget_groups[i].isVisible;
                if (iv!=undefined)
                {
                    if (iv.predicates!=undefined)
                    {
                        for (var j in iv.predicates)
                        {
                            var sid=iv.predicates[j].step_id;
                            var sn;
                            if (sid==undefined) sn=stepnum;
                            else sn=currentCaseData.GetStepIndexById(sid);
                            var wid=iv.predicates[j].widget_id;
                            var data;
                            if ((sn < 0) || (sn >= groups.length)) 
                            {
                                data = undefined;
                            }
                            data = groups[sn][wid].getValue();
                            SetWidgetValue(sn, wid, data);
                        }
                    }
                }
                if (tcp.widget_groups[i].widgets!=undefined)
                {    
                    for (var k in tcp.widget_groups[i].widgets)
                    {
                        var iv=tcp.widget_groups[i].widgets[k].isVisible;
                        if (iv!=undefined)
                        {
                            if (iv.predicates!=undefined)
                            {
                                for (var j in iv.predicates)
                                {
                                   var sid=iv.predicates[j].step_id;
                                   var sn;
                                   if (sid==undefined) sn=stepnum;
                                   else sn=currentCaseData.GetStepIndexById(sid);
                                   var wid=iv.predicates[j].widget_id;
                                   var data;
                                   if ((sn < 0) || (sn >= groups.length)) 
                                   {
                                       data = undefined;
                                   }
                                   data = groups[sn][wid].getValue();
                                   SetWidgetValue(sn, wid, data);
                               }
                            }
                        }
                    }
                }
            }    
        }
        CountVisibility(stepnum);
        HideInvisible(stepnum);
        
        CheckNextText(stepnum);
    }); 
}

function CountVisibility(stepnum)
{
    var tcp=solutionData.steps[stepnum];
    
   	for (var i in tcp.widget_groups)
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
			    for (var j in gr.isVisible.predicates)
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
    		for (var j in gr.widgets)
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
    
    for (var i in tcp.widgets)
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
				for (var k in w.isVisible.predicates)
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

function HideInvisible(stepnum)
{
  var tcs=stepnum;
      
  for (var i in solutionData.steps[tcs].widget_groups)
  {
    	if (solutionData.steps[tcs].widget_groups[i].visible==false)
    	{
    		for (var j in solutionData.steps[tcs].widget_groups[i].widgets)
		    {
			    if ((solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==true || solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==undefined) && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="MapsWidget" && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="TimerFromDateWidget" && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="StaticTextWidget" )
			    {
				    YUI().use('inputex', function(Y) 
    				{
    					window["step"+tcs+"FieldsList"][solutionData.steps[tcs].widgets[i].id].setOptions({required: false});
				    });
			    }

    		    $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").hide();
		    }
    	}
    	else
    	{
    		for (var j in solutionData.steps[tcs].widget_groups[i].widgets)
    		{
    			if (solutionData.steps[tcs].widget_groups[i].widgets[j].visible==false)
			    {
			        if ((solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==true || solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==undefined) && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="MapsWidget"&& solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="TimerFromDateWidget" && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="StaticTextWidget")
			    	{
			    		YUI().use('inputex', function(Y) 
		       			{
		    				window["step"+tcs+"FieldsList"][solutionData.steps[tcs].widget_groups[i].widgets[j].id].setOptions({required: false});
			    		});
			    	}

	    	        $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").hide();
			    }
	    		else
			    {
			        if ((solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==true || solutionData.steps[tcs].widget_groups[i].widgets[j].IsRequired==undefined) && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="MapsWidget"&& solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="TimerFromDateWidget" && solutionData.steps[tcs].widget_groups[i].widgets[j].widget_type!="StaticTextWidget")
				    {
				    	YUI().use('inputex', function(Y) 
    					{
    						window["step"+tcs+"FieldsList"][solutionData.steps[tcs].widget_groups[i].widgets[j].id].setOptions({required: true});
				    	});
				    }

	    		   $("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widget_groups[i].widgets[j].id + "_wrapper").show();
			    }
	   		}
	   	}
    }
    for (var i in solutionData.steps[tcs].widgets)
    {
    	if (solutionData.steps[tcs].widgets[i].visible==false)
    	{
		    if ((solutionData.steps[tcs].widgets[i].IsRequired==true || solutionData.steps[tcs].widgets[i].IsRequired==undefined)&&solutionData.steps[tcs].widgets[i].widget_type!="MapsWidget"&& solutionData.steps[tcs].widgets[i].widget_type!="TimerFromDateWidget"&& solutionData.steps[tcs].widgets[i].widget_type!="StaticTextWidget")
		    {
			    YUI().use('inputex', function(Y) 
    			{
    				window["step"+tcs+"FieldsList"][solutionData.steps[tcs].widgets[i].id].setOptions({required: false});
			    });
		    }
    		$("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id + "_wrapper").hide();
    	}
   		else
   		{
            if ((solutionData.steps[tcs].widgets[i].IsRequired==true || solutionData.steps[tcs].widgets[i].IsRequired==undefined)&&solutionData.steps[tcs].widgets[i].widget_type!="MapsWidget"&& solutionData.steps[tcs].widgets[i].widget_type!="TimerFromDateWidget"&& solutionData.steps[tcs].widgets[i].widget_type!="StaticTextWidget")
			{
				YUI().use('inputex', function(Y) 
	    		{
    				window["step"+tcs+"FieldsList"][solutionData.steps[tcs].widgets[i].id].setOptions({required: true});
				});
			}
			$("#"+"step_"+tcs+"_widget_"+solutionData.steps[tcs].widgets[i].id + "_wrapper").show();

		}
    }
}

// We need this method for current document mechanism
function CollectFormData()
{
          // [TODO] keep DRY
  var data = {};
  YUI().use('inputex', function(Y) 
  {
    for(var i = 0 ; i < groups.length ; i++)
    {
        data[solutionData.steps[i].id] = {};
        for(var widg in groups[i])
            data[solutionData.steps[i].id][widg] = groups[i][widg].getValue();
    }    
  });
  return data;
}

function CheckNextText (stepnum)
{
    var nextInfo = solutionData.steps[stepnum].next;
    var endExists=false;
    var disableExists=false;
    for (var i in nextInfo)
    {
        if (nextInfo[i].id=="endOfCase")
            endExists=true;
        if (nextInfo[i].id=="disableNext")
            disableExists=true;
    }
    if (endExists==false)
    {
        $("#next_btn").text("Следующий шаг");
    }
    if (disableExists==false)
    {
        $("#next_btn").removeAttr("disabled");
    }
    else
    {
        YUI().use('inputex', function(Y)
        {
            var nextInfo = solutionData.steps[stepnum].next;
            var end=false;
            var dis=false;
            for (var i in nextInfo)
            {
                if (nextInfo[i].id=="endOfCase" || nextInfo[i].id=="disableNext")
                {
                    var sid=nextInfo[i].step_id;
                    var wid=nextInfo[i].widget_id;
                    if (wid!=undefined)
                    {
                        var sn;
                        if (sid==undefined) sn=stepnum;
                        else sn=currentCaseData.GetStepIndexById(sid);
                        var data;
                        if ((sn < 0) || (sn >= groups.length)) 
                        {
                            data = undefined;
                        }
                        data = groups[sn][wid].getValue();
                        SetWidgetValue(sn, wid, data);
                    }
                    for (var j in nextInfo[i].predicates)
                    {
                        var sid=nextInfo[i].predicates[j].step_id;
                        var sn;
                        if (sid==undefined) sn=stepnum;
                        else sn=currentCaseData.GetStepIndexById(sid);
                        var wid=nextInfo[i].predicates[j].widget_id;
                        var data;
                        if ((sn < 0) || (sn >= groups.length)) 
                        {
                            data = undefined;
                        }
                        data = groups[sn][wid].getValue();
                        SetWidgetValue(sn, wid, data);
                    }
                    if (nextInfo[i].type == undefined) 
                    {
                        if (nextInfo[i].id=="endOfCase")
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
                            if (check==true)
                            {
                                end=true;
                            }
                        }
                        if (nextInfo[i].id=="disableNext")
                        {
                            var check=true;
                            for (var j in nextInfo[i].predicates)
                            {
                                check=this.CheckPredicate(nextInfo[i].predicates[j]);
                                if (check==false)
                                    break;
                            }
                            if (check==true)
                                dis=true;
                        }  
                    }
                }
            }
            if (end==true)
            {
               $("#next_btn").text("Завершить");
            }
            else
            {
               $("#next_btn").text("Следующий шаг");
            }
            if (dis==true)
            {
                $("#next_btn").attr("disabled", "disabled");
            }
            else
            {
                $("#next_btn").removeAttr("disabled");
            }
      } ); 
    }
}

function Save() {
  previousStepId = getPreviousStepId ( currentStepId );
  SaveFormData( previousStepId, currentStepId, function() {} );
}

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
  
  previousStepId=getPreviousStepId(currentStepId);

  ShowProperStep();
    
  setTimeout(AutoSave, autoSaveTime);  
  window.onbeforeunload = Save();

  CheckWidgetsVisibilityAndNextText(currentCaseData.GetStepIndexById(currentStepId));
});


