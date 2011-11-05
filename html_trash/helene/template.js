var server = {}
server.get_template = function(template) {
	let templates = { "Самозахват парковочных мест.tmpl":
		"<p>Уважаем[?ый/ая] {ФИО руководителя},"
	+	"<p>Информирую Вас, что во дворе дома по адресу {адрес} установлены незаконные ограждения ({тип ограждений}). Ограждения мешают движению транспорта, проезду автомашин скорой помощи, МЧС, земельный участок под самовольно возведенными ограждениями используется не по назначению. Кроме того, возведением ограждений нарушаются положения пункта 3 статьи 25 Федерального закона «Об архитектурной деятельности в РФ»."
	+	"<p>Учитывая тот факт, что ограждения нарушают права внутригородского муниципального образования {название муниципального образования} как собственника земельного участка, прошу Вас принять меры по ликвидации незаконно установленных ограждений (в соответствии со ст.340 ГК РФ)."
	+	"<p>Приложения: {Фотографии незаконно установленных ограничителей}"
	+	"<p>Контактная информация: {контактная информация}",
	"Холодные батареи.tmpl":
	"<p>Руководителю {Наименование организации}"
+ "<p>от {Ваши ФИО} <p> проживающ[?его/ей] по адресу {Ваш адрес}"
+ "<br><br><br><br>"
+"<p>Претензия на недолжное качество предоставляемых коммунальных услуг"
+"<p>С вашей организацией у меня заключен договор коммунального обслуживания № {Номер вашего договора коммунального обслуживания} от {Дата заключения договора коммунального обслуживания}, по которому вы обязаны предоставлять мне жилищно-коммунальные услуги."
+"<p>Я своевременно и полностью оплачиваю стоимость жилищно-коммунальных услуг."
+"<p>В соответствии со ст. 4 и 7 Закона Российской Федерации «О защите прав потребителей» качество жилищно-коммунальных услуг должно соответствовать обязательным требованиям государственных стандартов, санитарных норм и правил, и других документов, которые в соответствии с законом устанавливают обязательные требования к качеству товаров (работ, услуг)."
+"<p>Начиная с {Дата начала проблем с отоплением}, то есть в течение последних {Длительность проблем с отоплением (в днях)}, вашей организацией нарушаются требования Государственного стандарта Российской Федерации ГОСТ России 51617-2000 «Жилищно-коммунальные услуги. Общие технические условия», принятого постановлением Росстандарта РФ от 19 июня 2000 г. № 158-ст, а именно:"
+"<p>Температура в жилых помещениях составляет {Температура в жилой комнате}"
+"<p>На основании изложенного, прошу:<p>1. Незамедлительно устранить недостатки предоставления жилищно-коммунальных услуг. <p>2. Произвести пересчет размера платы за коммунальные услуги ненадлежащего качества.<p> В случае неисполнения моих требований, мною будут поданы жалоба в прокуратуру и исковое заявление в суд, содержащее помимо указанных, так же требования об уплате неустойки, установленной Законом РФ «О защите прав потребителя», и о возмещении понесенных мною убытков.<br><br><br>Дата<br>Подпись"
	};
	return templates[template];
}