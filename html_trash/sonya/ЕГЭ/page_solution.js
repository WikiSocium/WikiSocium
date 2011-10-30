page_solution = function() { pages.list["page_solution"] = this }
new page_solution();

var widget_types = {}
var solution_widgets = []

let show_first = false;
let show_second = false;
let show_third = false;

page_solution.prototype.on_show = Step_All ;

////////////////////////////////////////Functions//////////////////////////////////////////


//**************************ADD_STEPS****************************************
function Step_All (solution,user_case) {

	$("#solutions_name").html(solution.short_name);
	$("#solutions_info").html(solution.info);

	let container = $("#steps")
	container.empty();
	solution_widgets = []; // not good - управление не из одной точки

	
	for( let [step_id,step] in Iterator(solution.steps) ) {
		{		
		let el = document.createElement("div");
		$(el)
			.addClass("step")
			.addClass("step_"+step_id)
			.attr("id","step_"+step_id)
			.append(render_step(step,step_id,user_case));
			if(step_id>0){$(el).hide();}
		container.append(el);
		}
	}

}
//**************************************************************************

//**************************RENDER_STEP*************************************
function render_step(step,step_id,user_case) {
	let step_els = [];
	for( let [widget_id,widget] in Iterator(step) ) {
		if( widget.widget_type ) {
			let w = new widget_types[widget.widget_type](widget);
			w.widget_id = widget_id
			w.step_id = step_id
			let user_value = user_case[step_id+"_"+widget_id];
			if( user_value ) {
				w.set_value(user_value);
			}
			solution_widgets.push(w);
			step_els.push(w.DOM);
		}
	}
	return step_els;
}
//****************************************************************************

//***************************CLOSE_SOLUTION***********************************
function close_solution() {
	for( let [,widget] in Iterator(solution_widgets) ) {
		if( widget.variable ) {
			let user_value = widget.get_value();
			if( user_value ) {
				user_case[widget.step_id+"_"+widget.widget_id] = user_value;
			}
		}
	}
	localStorage.setItem(user_case.id,JSON.stringify( user_case ));
	show_page("page_search")
}

//****************************************************************************

//***************************GENERATE_DOCUMENT********************************
function on_generate_doc(e) {
	let variables = {};
	let template = server.get_template(e.data.template);
	for( let [,widget] in Iterator(solution_widgets) ) {
		if( widget.variable ) {
		//variables[widget.variable] = $("#"+widget.variable).attr("value"); // к солжалению, хотя и ищет кириллические id, id с пробелами - нет
		// впрочем, это и не надо. поскольку надо юзать интерфейс виджета
			variables[widget.variable] = widget.get_value();
		}
	}
	let rez = generate_document(template,variables,"html")
	alert(rez);
}

function generate_document( template, variables, format ) {
	return template.replace(
		/\{(.*?)\}/g
	,	function(substr) {
			let var_id = substr.slice(1,-1);
			return variables[var_id] ? variables[var_id] : substr ;
		}
	);
}
//****************************************************************************










////////////////////////////////////////Widgets////////////////////////////////////////////


//***************SHORT LABLE**********************
t_widget_short_label = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html(widget_desc.text)
		.addClass("short_label");
}
widget_types["short_label"] = t_widget_short_label;

//************************************************

//*****************TEXT***************************
t_widget_text = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html(widget_desc.text)
		.addClass("text");
}
widget_types["text"] = t_widget_text;
//************************************************


//*************INPUT_FREE_TEXT********************
t_widget_input_free_text = function(widget_desc) {
	this.variable = widget_desc.variable; 
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='text' id='"+this.variable+"'> "+this.variable)
		.addClass("input_free_text");
}
t_widget_input_free_text.prototype.get_value = function() {
	return this.DOM.children[0].value;
}
t_widget_input_free_text.prototype.set_value = function(value) {
	this.DOM.children[0].value = value;
}
widget_types["input_free_text"] = t_widget_input_free_text;

//************************************************

//*******************PRINT************************
t_widget_print = function(widget_desc) {
	this.template = widget_desc.template; 
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='button' value='"+strings.generate_doc+"'>")
		.addClass("input_free_text")
		.click({template:this.template,case_id:"??? а оно нам надо?"},on_generate_doc);
}
widget_types["print"] = t_widget_print;
//************************************************

//********************SUCCESS*********************
t_widget_success = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='button' value='"+strings.success+"'>")
		.addClass("input_free_text")
		.click(close_solution);
}
widget_types["success"] = t_widget_success;

//************************************************

//********************FAILURE*********************
t_widget_failure = function(widget_desc) {
	this.DOM = document.createElement("div");
	let el = document.createElement("input");
	$(el).attr("type","button").attr("value",strings.failure);
	$(this.DOM)
		.append(el)
		.addClass("input_free_text")
		.click(close_solution);
}
widget_types["failure"] = t_widget_failure;


//************************************************


//*****************SHOW_STEP_BUTTON****************************************************************************
t_widget_show_step = function(widget_desc) {
	 
	//document.write(problems[parseInt(widget_desc.variant_num)]);	
	this.DOM = document.createElement("input");
	$(this.DOM)
		.attr("type", "button")
		.attr("value", problems[parseInt(widget_desc.variant_num)-1] + "+")
		.addClass("show_button")
		.attr("id","show_button_"+widget_desc.variant_num)
		.click  (
			 function() 
				{
				 var s = $(document.getElementById("show_button_"+widget_desc.variant_num)).attr("value");
				 switch(s)
					{
					case (problems[parseInt(widget_desc.variant_num)-1] + "+"):
						
					 	 $(document.getElementById("step_"+widget_desc.variant_num)).show()
				 		 $(document.getElementById("show_button_"+widget_desc.variant_num)).attr("value",problems[parseInt(widget_desc.variant_num)-1] + "-");
					  break;
					case (problems[parseInt(widget_desc.variant_num)-1] + "-"):
					  	if(!show_first) $(document.getElementById("step_"+widget_desc.variant_num)).hide()
				 		$(document.getElementById("show_button_"+widget_desc.variant_num)).attr("value",problems[parseInt(widget_desc.variant_num)-1] + "+");
					  break;
					default: ;
					}
					
				}
			);
					
}
widget_types["show_step"] = t_widget_show_step;
//************************************************************************************************************************************************

//*************************************READ*****************************************************
t_widget_read = function(widget_desc) {
	this.template = widget_desc.template; // TODO: prototype ?
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='button' value='"+strings.read+"'>")
		.addClass("input_free_text")
		.click({template:this.template,case_id:"??? а оно нам надо?"},on_generate_doc);
}
widget_types["read"] = t_widget_read;
//***********************************************************************************************


//**********************HYPER_LINK***************************************************************
t_widget_hyper_link = function(widget_desc) {
	
this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<a href =\""+ widget_desc.hlink+"\">"+ widget_desc.text+ "</a> <p><p><p>");

	
}
widget_types["hyper_link"] = t_widget_hyper_link;
//***********************************************************************************************


//*********************************HIDDEN_TEXT***************************************************

t_widget_hidden_text = function(widget_desc) {
	
	
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html(information[parseInt(widget_desc.text_string)])
		.addClass(widget_desc.text_name)
		.attr("id",widget_desc.text_name);
		//.hide();
	
	switch(widget_desc.flaghide)
		{
		 case "1":
		 $(this.DOM).hide();
		 break;
		};
	
}
widget_types["hidden_text"] = t_widget_hidden_text;

//***********************************************************************************************


//*************************HIDE_BUTTON***********************************************************
t_widget_hide_button = function(widget_desc) {
		
	this.DOM = document.createElement("input");
	$(this.DOM)
		.attr("type", "button")
		.addClass("hide")
		.attr("value", strings.show)
		.attr("id","hide_"+widget_desc.hidden_object)
		.click  (
			 function() 
				{ 
				 var s = $(document.getElementById("hide_"+widget_desc.hidden_object)).attr("value");
				 switch(s)
					{
					case strings.show:
					 	 $(document.getElementById(widget_desc.hidden_object)).show()
				 		 $(document.getElementById("hide_"+widget_desc.hidden_object)).attr("value", strings.hide)
					  break;
					case strings.hide:
					  	$(document.getElementById(widget_desc.hidden_object)).hide()
				 		$(document.getElementById("hide_"+widget_desc.hidden_object)).attr("value", strings.show)
					  break;
					default: ;
					}
					  
					
				}
			);
		
}
widget_types["hide_button"] = t_widget_hide_button;

//***********************************************************************************************











