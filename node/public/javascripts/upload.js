function uploadFailed(evt) {
  alert("There was an error attempting to upload the file.");
}

function uploadCanceled(evt) {
  alert("The upload has been canceled by the user or the browser dropped the connection.");
}

function JS_upload_handler(fileInputId, submitButtonId, progressBarInitFunc) {
  console.log('IE fix'); // I don't know why, but this log fixes IE action
  
  var progress_bar_id;

  $('#'+fileInputId).on('change', function() {
    var delimeter = ': ';
    var file = $('#'+fileInputId).get(0).files[0];
  });

  $('#'+submitButtonId).on('click', function() {
    var file = $('#'+fileInputId).get(0).files[0];

    progressBarId = progressBarInitFunc(file.name);  

    var fd = new FormData();
    fd.append('uploadingFile', file);
    fd.append('date', (new Date()).toString()); // req.body.date
    fd.append('comment', 'This is a test.'); // req.body.comment

    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", function(evt) {
      uploadProgress(evt, progressBarId);
    }, false);
    xhr.addEventListener("load", function(evt) {
      uploadComplete(evt, progressBarId);
    }, false);
    xhr.addEventListener("error", uploadFailed, false);
    xhr.addEventListener("abort", uploadCanceled, false);

    xhr.open("POST", "/fileUpload");
    xhr.send(fd);
  });
}