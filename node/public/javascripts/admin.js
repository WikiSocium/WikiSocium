function AddRemoveTextFields ( name, nametwo ) {  
  $('.add_'+name).click(function(){
    $('#'+name+'_fields').append('<div style="margin-bottom: 4px;">'+$('#'+name+'_fields').children(":first").html()+'</div>');
    for (var i=0; i < $('#'+name+'_fields').children().length; i++) {
      $('#'+name+'_fields').children().eq(i).children('.'+name).attr('name',name+'['+i+']');
      if (typeof(nametwo)=='string')
        $('#'+name+'_fields').children().eq(i).children('.'+nametwo).attr('name',nametwo+'['+i+']');        
    }
  });
  $('.remove_'+name).live('click', function(){
    if ( $('#'+name+'_fields').children().length > 1 ) {
      $(this).parent().remove();
      for (var i=0; i < $('#'+name+'_fields').children().length; i++) {
        $('#'+name+'_fields').children().eq(i).children('.'+name).attr('name',name+'['+i+']');
        if (typeof(nametwo)=='string')
          $('#'+name+'_fields').children().eq(i).children('.'+nametwo).attr('name',nametwo+'['+i+']');        
      }
    }
  });
}