var server = {}
server.get_template = function(template) {
	let templates = { "Коротенько о ЕГЭ.tmpl":
		"<p>Сабж"
		};
	return templates[template];
}
