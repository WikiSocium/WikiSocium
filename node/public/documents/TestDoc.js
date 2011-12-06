function GenerateDocument_TestDoc(){$('#documentView_TestDoc').html((function anonymous(locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var __ = [{ lineno: 1, filename: undefined }];
try {
var buf = [];
with (locals || {}) {
var interp;
__.unshift({ lineno: 1, filename: __[0].filename });
__.unshift({ lineno: 2, filename: __[0].filename });
buf.push('\n<div>');
__.unshift({ lineno: undefined, filename: __[0].filename });
__.unshift({ lineno: 2, filename: __[0].filename });
buf.push('' + escape((interp = data[0].fio) == null ? '' : interp) + ', this is a test document with a param.\n');
__.shift();
__.shift();
buf.push('\n</div>');
__.shift();
__.shift();
}
return buf.join("");
} catch (err) {
  rethrow(err, __[0].filename, __[0].lineno);
}
})({'data':CollectFormData()}));}