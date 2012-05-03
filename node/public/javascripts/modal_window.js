function modalButton ( text, action ) {
  this.text = text;
  this.action = action;
}

function showModalWindow ( in_title, in_body, in_buttons, in_width, in_height, in_modal_container_id ) {
  var modal_container_id = "";
  if ( typeof(in_modal_container_id) == "undefined" ) modal_container_id = "modal_window";
  else modal_container_id = in_modal_container_id;
  $( "#"+modal_container_id ).attr( "title", in_title );
  if ( in_body != "") $( "#"+modal_container_id ).html( in_body );
 
  var jqui_button = {};  
	for (var key in in_buttons) {
    jqui_button[in_buttons[key].text] = in_buttons[key].action;
  }
  
	$( "#"+modal_container_id ).dialog({
		modal: true,
		draggable: false,
		resizable: false,
		width: in_width,
		height: in_height,
		buttons: jqui_button
	});
}
