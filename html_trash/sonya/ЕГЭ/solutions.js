
var solutions = {
		"первая проблема":
		{
			short_name: "ЕГЭ и отстой"
		,	info: "На ЕГЭ произошло что-то, что не укладывается в Вашу картину мира"
		,	steps:	[
						[
							{ widget_type: "short_label", text: "Почитайте информацию" }
						,	{ widget_type: "hide_button", hidden_object: "ex_inf"}						
						,	{ widget_type: "hidden_text", flaghide:"1", text_string: "0", text_name: "ex_inf"}
						,	{ widget_type: "text", text: "И какие у Вас проблемы?" }
						,	{ widget_type: "show_step", variant_num: "1"}
						,	{ widget_type: "show_step", variant_num: "2"}
						,	{ widget_type: "show_step", variant_num: "3"}
						,	{ next_step: 2 }
						]
				,		[
							{ widget_type: "short_label", text: "Отстой номер раз" }
						,	{ widget_type: "text", text: "Апелляция о нарушении установленного порядка проведения ЕГЭ подается в день экзамена после сдачи бланков ЕГЭ не выходя из пункта проведения экзамена (ППЭ).<p>Ознакомьтесь с подробной информацией"}
						,	{ widget_type: "hide_button", hidden_object: "1_inf"}						
						,	{ widget_type: "hidden_text",  flaghide:"1",text_string: "1", text_name: "1_inf"}
						,	{ widget_type: "success" }
						,	{ widget_type: "failure" }
						,	{ next_step: 3 }
						]
				,		[
							{ widget_type: "short_label", text: "Отстой номер два" }
						,	{ widget_type: "text", text: "Апелляция о несогласии с результатами ЕГЭ подается в течение 2 рабочих дней после официального объявления индивидуальных результатов экзамена и ознакомления с ними участника ЕГЭ.<p>Ознакомьтесь с подробной информацией"}						
						,	{ widget_type: "hide_button", hidden_object: "2_inf"}						
						,	{ widget_type: "hidden_text", flaghide:"1",text_string: "2", text_name: "2_inf"}
						,	{ widget_type: "success" }
						,	{ widget_type: "failure" }
						,	{ next_step: 3 }
						]
				,		[
							{ widget_type: "short_label", text: "Отстой номер три" }
						,	{ widget_type: "hidden_text", flaghide:"0",text_string: "3", text_name: "3_inf"}
						,	{ widget_type: "hyper_link", text:"Электронная приемная", hlink: "http://www.obrnadzor.gov.ru/ru/public_reception/reception/"}
						,	{ widget_type: "success" }
						,	{ widget_type: "failure" }
						,	{ next_step: 3 }
						]
				]
		}
	}
	
