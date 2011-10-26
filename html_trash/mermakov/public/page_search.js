page_search = function() {
	pages.list["page_search"] = this
}
new page_search();

page_search.prototype.on_show = function() {
	let container = $("#solutions_list")
	container.empty();
	for( let [solution_id,solution] in Iterator(solutions) ) {
		let el = document.createElement("div")
		$(el)
			.addClass("solution_search_result")
			.html(solution.short_name)
			.click(select_solution)
			.attr("id",solution_id);
		container.append(el)
	}
}

var user_case;
var solution;

function select_solution(e) {
	let solution_id = e.target.id;
	solution = solutions[solution_id];
	user_case = { id:localStorage.length, solution: solution_id }
	localStorage.setItem(localStorage.length,JSON.stringify( user_case ));
	add_user_case_to_profile(user_case);
	show_page("page_solution",solution,user_case);
}

function add_user_case_to_profile(user_case) {
	let el = document.createElement("li")
	$("#user_cases").append(el)
	let id = user_case.id
	$(el).html(solutions[user_case.solution].short_name + " " + user_case.id).click( function() { on_case_select(id) } ) // solution vs solution_id
}

function on_case_select(user_case_id) {
	close_solution();
	let user_case_json = localStorage.getItem(user_case_id)
	user_case = JSON.parse( user_case_json )
	solution = solutions[user_case.solution] // вот ведь уродство :)
	show_page("page_solution",solution,user_case);
}


