function on_body_load() {

    show_page("page_search");

    show_profile();

}



var pages = {

                page_active: undefined

            ,   list: {}

            }



function show_page(page_to_show) {

    $("#" + pages.page_active ).removeClass("page_active")

    pages.page_active = page_to_show

    $("#" + pages.page_active ).addClass("page_active")



    let args = Array.prototype.slice.call(arguments);

    args.shift();

    page = pages.list[page_to_show];

    page.on_show.apply(page,args);

}



function show_profile() {

    let name = get_user_name();

    if( name ) {

        create_user_name_control1(name);

    } else {

        create_user_name_control2("");

    }



    for( let [key,value] in Iterator(localStorage) ) {

        if( key == "name" ) continue;
        // копипаста

        let user_case_json = localStorage.getItem(key)

        user_case = JSON.parse( user_case_json )

        // копипаста

        let el = document.createElement("li")

        $("#user_cases").append(el)

        let id = user_case.id

        $(el)
            .html(solutions[user_case.solution].short_name + " " + user_case.id)
            .click( function() { on_case_select(id) } )


    }

}



function get_user_name() localStorage.getItem("name")



function set_user_name(e) {

    let name = e.target.value;

    localStorage.setItem("name",name);

    create_user_name_control1(name);

}

function change_user_name(e) {

    let name = get_user_name();

    create_user_name_control2(name);

}



function create_user_name_control1(name) {

    let el = document.createElement("div");

    $("#congratulations").empty().append(el);

    $(el).html(strings.hello+name).click( change_user_name );

}

function create_user_name_control2(name) {

    $("#congratulations").html("<input type='text' value='"+name+"' id='edit_name'>");

    $("#edit_name").focus().focusout( set_user_name );

}


