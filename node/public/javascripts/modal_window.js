function modalButton ( text, action, style ) {
  this.text = text;
  this.action = action;
  if (style==null) style = '';
  else this.style = style;
}

var g_modal_windows_containers = new Array();

function showModalWindow ( in_title, in_body, in_buttons, in_modal_container_id, in_width, in_height ) {
  var modal_container_id = "";
  if ( typeof(in_modal_container_id) == "undefined" ) modal_container_id = "modal_window";
  else modal_container_id = in_modal_container_id;
  
  /* JQueryUI version
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
  */
  //Using Bootstrap modal windows now
  
  if (in_body == "") {
    var first_call = true;
    for (var key in g_modal_windows_containers)
      if (g_modal_windows_containers[key].id == modal_container_id) {
        first_call = false;
        in_body = g_modal_windows_containers[key].body;
        break;
      }
    if (first_call) {
      g_modal_windows_containers.push({
        id: modal_container_id,
        body: $( "#"+modal_container_id ).html()
      });
      in_body = $( "#"+modal_container_id ).html();
    }
  }
  
  $( "#"+modal_container_id ).addClass('modal');
  $( "#"+modal_container_id ).css('width',in_width);
  $( "#"+modal_container_id ).css('height',in_height);
  
  var modal_html = '<div class="modal-header"><button type="button" class="close" data-dismiss="modal">×</button><h3>'+in_title+'</h3> </div>  <div class="modal-body">'+in_body+'</div>';
  modal_html += '<div class="modal-footer">';
  for (var key in in_buttons) {
    modal_html += '<button class="btn '+in_buttons[key].style+'" id="'+modal_container_id+'_'+in_buttons[key].text+'">'+in_buttons[key].text+'</button>';
  }
  modal_html += '</div>';  
  $( "#"+modal_container_id ).html( modal_html );
  
  for (var key in in_buttons) {
    if ( in_buttons[key].action == 'cancel' )
      $( "#"+modal_container_id+"_"+in_buttons[key].text ).click(
        function() { $( '#'+modal_container_id ).modal('hide'); }
      );
    else $( "#"+modal_container_id+"_"+in_buttons[key].text ).click(in_buttons[key].action);
  }
    
  $("#"+modal_container_id).modal();  
}