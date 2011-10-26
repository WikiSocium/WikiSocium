page_solution = function() { pages.list["page_solution"] = this }
new page_solution();

var tree_visibility = ["main"];

page_solution.prototype.on_show = function(solution,user_case) {

	$("#solutions_name").html(solution.short_name);
	$("#solutions_info").html(solution.info);

	let container = $("#steps")
	container.empty();
	solution_widgets = []; // not good - управление не из одной точки
	if (user_case["visibility"] != undefined) {
		tree_visibility = user_case["visibility"];
	}
	validate_date("dd.mmm.yyyy", "1 Янв 2009");
	for( let [step_id,step] in Iterator(solution.steps) ) {
		let el = document.createElement("div");
		let caption = document.createElement("div"); //шаг состоит из заголовка и тела
		$(caption)
			.addClass("short_label")
			.html(step.caption);
		let body = document.createElement("div");
		$(caption).click(function() { $(this).siblings(".step_body").slideToggle(); });
		if (step.hidden == true) { //делаем тело сворачиваемым
			$(body).hide();
		}
		$(body) //в тело сваливаем виджеты
			.addClass("step_body")
			.attr("id","step_"+step_id+"_body")
			.append(render_step(step.widget_list,step_id,user_case));
		
		$(el)
			.addClass("step")
			.addClass("tree_" + step.tree)
			.attr("id","step_"+step_id)
			.append(caption)
			.append(body);
		for (var i = 0; i < step.tree.length; i ++) {
			$(el).addClass("tree_" + step.tree[i]);
			if (tree_visibility.indexOf(step.tree[i]) == -1) {
				$(el).hide();
			}
		}
		container.append(el);
	}

}

function render_step(step,step_id,user_case) {
	let step_els = [];
	for( let [widget_id,widget] in Iterator(step) ) {
		if( widget.widget_type ) {
			let w = new widget_types[widget.widget_type](widget);
			w.widget_id = widget_id;
			w.step_id = step_id;
			let user_value = user_case[step_id+"_"+widget_id];
			if( user_value ) {
				w.set_value(user_value);
			}
			solution_widgets.push(w);
			$(w.DOM).addClass("tree_" + widget.tree);
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
t_widget_upload = function(widget_desc) {
	this.DOM = document.createElement("div");
	let button_element = document.createElement("div");
	$(button_element)
		.html("<input type='button' value='Отправить'>")
		.addClass("upload_button")
		.attr("disabled", "disabled")
		.click(function() { alert("Загрузка выполнена"); });
	$(this.DOM)
		.html("<input type='file' id='upload'>")
		.append(button_element)
		.click(function() { 
					if(this.value != "") {
						$(this).children(".button_element").removeAttr("disabled");
					}
				});
}
widget_types["upload"] = t_widget_upload;

t_widget_upload.prototype.get_value = function() {
	return this.DOM.children[0].value;
}

//
t_widget_success = function(widget_desc) {
	this.DOM = document.createElement("div");
	let button_element = document.createElement("input");
	$(button_element)
		.attr("type", "button")
		.attr("value", (widget_desc.label == "") ? strings.success : widget_desc.label)
		.click(close_solution);
	$(this.DOM)
		.append(button_element)
		.addClass("input_free_text");
}
widget_types["success"] = t_widget_success;

//
t_widget_failure = function(widget_desc) {
	this.DOM = document.createElement("div");
	let button_element = document.createElement("input");
	$(button_element)
		.attr("type","button")
		.attr("value", (widget_desc.label == "") ? strings.failure : widget_desc.label)
		.click(close_solution);
	$(this.DOM)
		.append(button_element)
		.addClass("input_free_text");
}
widget_types["failure"] = t_widget_failure;


t_widget_select_tree = function(widget_desc) {
	this.DOM = document.createElement("div");
	let button_element = document.createElement("input");
	let $button_element = $(button_element);
	$button_element
		.attr("type", "button")
		.attr("value", widget_desc.label)
		.data("open_tree", widget_desc.open_tree)
		.data("close_tree", widget_desc.close_tree)
		.click(function() 	{
								let ancestor_body = $(this).parent().parent();
								ancestor_body.slideToggle();
								let ancestor_step = ancestor_body.parent();
								let open_tree = $(this).data("open_tree");
								let close_tree = $(this).data("close_tree");
								for (var i = 0; i < open_tree.length; i ++) {
									ancestor_step.siblings(".tree_" + open_tree[i]).show();
									if (tree_visibility.indexOf(open_tree[i]) == -1) {
										tree_visibility.append(open_tree[i]);
									}
								}
								for (var i = 0; i < close_tree.length; i ++) {
									ancestor_step.siblings(".tree_" + close_tree[i]).hide(); 
									var index = tree_visibility.indexOf(close_tree[i]);
									if (index != -1) {
										tree_visibility.splice(index, 1);
									}
								}
							});
	$(this.DOM)
		.append(button_element)
		.addClass("open_tree");
}
widget_types["select_tree"] = t_widget_select_tree;


t_widget_select_list_with_info = function(widget_desc) {
	this.DOM = document.createElement("div");
	let list_element = document.createElement("select");
	let button_element = document.createElement("input");
	for (let [item_id, item] in Iterator(widget_desc.item_list)) {
		$(document.createElement('option'))
			.val(widget_desc.value_list[item_id])
			.text(item)
			.appendTo($(list_element));
	}
	$(button_element)
		.attr("type", "button")
		.attr("value", "Показать информацию")
		.click(function() {alert($(this).siblings(".select_list").val());})
		.appendTo($(this.DOM));
	$(list_element)
		.addClass("select_list")
		.appendTo($(this.DOM));
}
widget_types["select_list_with_info"] = t_widget_select_list_with_info;
	

function close_solution() {
	for( let [,widget] in Iterator(solution_widgets) ) {
		if( widget.variable ) {
			let user_value = widget.get_value();
			if( user_value ) {
				user_case[widget.step_id+"_"+widget.widget_id] = user_value;
			}
		}
	}
	user_case["visibility"] = tree_visibility;
	localStorage.setItem(user_case.id,JSON.stringify( user_case ));
	show_page("page_search")
}


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


