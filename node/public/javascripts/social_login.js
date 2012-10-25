function ReturnOnSuccessLogin( uid, social_name ) {
  var form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("action", "/sessions/");      
  form.setAttribute("id", social_name+"_auth_form");

  var params = new Array();
  params['user['+social_name+'_uid]'] = uid;
  params['social_name'] = social_name;

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }

  window.opener.document.body.appendChild(form);
  window.opener.document.getElementById(social_name+"_auth_form").submit();
  self.close();
}

function LoginInternally(social_name, uid, callback) {
  $.ajax(
  {
    url: '/social/login',
    type: 'POST',
    data: 'social_name=' + social_name + '&uid=' + uid,
    success: function(res) {
      callback(res);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // To do
    }
  });
}