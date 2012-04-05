function modalButton ( text, action ) {
  this.text = text;
  this.action = action;
}

function showModalWindow ( in_title, in_body, in_buttons, in_width, in_height ) {
  $( "#modal_window" ).attr( "title", in_title );
  $( "#modal_window" ).html( in_body );
 
  var jqui_button = {};  
	for (var key in in_buttons) {
    jqui_button[in_buttons[key].text] = in_buttons[key].action;
  }
  
	$( "#modal_window" ).dialog({
		modal: true,
		draggable: false,
		resizable: false,
		width: in_width,
		height: in_height,
		buttons: jqui_button
	});
}
