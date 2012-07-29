function GenerateDocument_TestDoc(){$('#documentView_TestDoc').html((function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var __jade = [{ lineno: 1, filename: undefined }];
try {
var buf = [];
with (locals || {}) {
var interp;
__jade.unshift({ lineno: 1, filename: __jade[0].filename });
__jade.unshift({ lineno: 2, filename: __jade[0].filename });
buf.push('\n<div>');
__jade.unshift({ lineno: undefined, filename: __jade[0].filename });
__jade.unshift({ lineno: 2, filename: __jade[0].filename });
buf.push('' + escape((interp = data[0].fio) == null ? '' : interp) + ', this is a test document with a param.\n');
__jade.shift();
__jade.shift();
buf.push('\n</div>');
__jade.shift();
__jade.shift();
}
return buf.join("");
} catch (err) {
  rethrow(err, __jade[0].filename, __jade[0].lineno);
}
})({'data':CollectFormData()}));}