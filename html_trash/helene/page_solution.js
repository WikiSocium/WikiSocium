page_solution = function() { pages.list["page_solution"] = this }
new page_solution();

page_solution.prototype.on_show = function(solution,user_case) {

	$("#solutions_name").html(solution.short_name);
	$("#solutions_info").html(solution.info);

	let container = $("#steps")
	container.empty();
	solution_widgets = []; // not good - управление не из одной точки

	for( let [step_id,step] in Iterator(solution.steps) ) {
		let el = document.createElement("div");
		$(el)
			.addClass("step")
			.attr("id","step_"+step_id)
			.append(render_step(step,step_id,user_case));
		container.append(el);
	}

}

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




var widget_types = {}
var solution_widgets = []

//
//
//

t_widget_short_label = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html(widget_desc.text)
		.addClass("short_label");
}
widget_types["short_label"] = t_widget_short_label;


// копипаста
t_widget_text = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html(widget_desc.text)
		.addClass("text");
}
widget_types["text"] = t_widget_text;

t_widget_table=function(widget_desc) {
	this.DOM=document.createElement("table");
	var str=""
	str=str+"<caption>"+widget_desc.caption+"<\caption><tbody><tr>"
	for (var head in widget_desc.header)
		str=str+"<td>"+widget_desc.header[head]+"</td>";
	str=str+"</tr>"
	for (var row in widget_desc.rows)
	{
		str=str+"<tr>"
		for (var col in widget_desc.rows[row])
			str=str+"<td>"+widget_desc.rows[row][col]+"</td>";
		str=str+"</tr>";
	}
	str=str+"<tbody>"
	$(this.DOM)
		.html(str)
		.addClass("table");
}
widget_types["table"]=t_widget_table;

//
t_widget_input_free_text = function(widget_desc) {
	this.variable = widget_desc.variable; // TODO: prototype ?
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='text' id='"+this.variable+"'> "+this.variable)
		.addClass("input_free_text");
}
t_widget_input_free_text.prototype.get_value = function() {
	return this.DOM.children[0].value; // ненадежно
}
t_widget_input_free_text.prototype.set_value = function(value) {
	this.DOM.children[0].value = value;
}
widget_types["input_free_text"] = t_widget_input_free_text;

//
t_widget_input_date = function(widget_desc) {
	this.variable = widget_desc.variable; // TODO: prototype ?
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='text' id='"+this.variable+"'> "+this.variable)
		.addClass("input_date");
}
t_widget_input_date.prototype.get_value = function() {
	return this.DOM.children[0].value; // ненадежно
}
t_widget_input_date.prototype.set_value = function(value) {
	this.DOM.children[0].value = value;
}
widget_types["input_date"] = t_widget_input_date;

//
t_widget_input_number = function(widget_desc) {
	this.variable = widget_desc.variable; // TODO: prototype ?
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='text' id='"+this.variable+"'> "+this.variable)
		.addClass("input_free_text");
}
t_widget_input_number.prototype.get_value = function() {
	return this.DOM.children[0].value; // ненадежно
}
t_widget_input_number.prototype.set_value = function(value) {
	this.DOM.children[0].value = value;
}
widget_types["input_number"] = t_widget_input_number;



//
t_widget_print = function(widget_desc) {
	this.template = widget_desc.template; // TODO: prototype ?
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='button' value='"+strings.generate_doc+"'>")
		.addClass("input_free_text")
		.click({template:this.template,case_id:"??? а оно нам надо?"},on_generate_doc);
}
widget_types["print"] = t_widget_print;

//
t_widget_success = function(widget_desc) {
	this.DOM = document.createElement("div");
	$(this.DOM)
		.html("<input type='button' value='"+strings.success+"'>") // будет глючить на кавычках и апострофах
		.addClass("input_free_text")
		.click(close_solution);
}
widget_types["success"] = t_widget_success;

//
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



//
//
//

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


