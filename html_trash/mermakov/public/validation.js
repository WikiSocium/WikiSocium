/* Все функции валидации кидают исключения, если входные данные неправильные.
   На мой взгляд, это удобно с точки зрения различения ошибок.
 */

/* Валидация числа.
	Выбираем тип, запускаем функцию, указываем минимальное допустимое значение,
	максимальное допустимое значение. Если не нужны min и max, пишем "".
	Не забываем ловить исключения.
*/

var numeric_regexp = {};
numeric_regexp["int"] = /(^-?\d+$)/;
numeric_regexp["float"] = /(^-?(\d+(\.|,)?\d*)|(\d*(\.|,)?\d+))/;

function validate_number(type, value, min, max) {
	if (numeric_regexp[type].test(value) == false) {
		throw "illegal string";
	}
	var numeric_value = parseInt(value);
	if (min != null) {
		if (numeric_value < min) {
			throw "out of bounds";
		}
	}
	if (max != null) {
		if (numeric_value > max) {
			throw "out of bounds";
		}
	}
	return numeric_value;
}

/* Валидация файла.
	Ничего, кроме проверки расширения я пока придумать не могу,
	да и это не очень универсально.
	Передаём имя файла и тип файла:
			image - jpg, png, bmp, gif, tiff, ico (изображение)
			video - avi, mkv, mp4, mpg, flv, swf, mov (видео)
			sound - mp3, ogg, wav, mid, midi, pcm (звук)
			text - txt, doc, rtf, pdf (текст)
	Не забываем ловить исключение.
*/

var file_extension_regexp = {};
file_extension_regexp["image"] = /.*(jpg|png|bmp|gif|tiff|ico)$/;
file_extension_regexp["video"] = /.*(avi|mkv|mp4|mpg|flv|swf|mov)$/;
file_extension_regexp["sound"] = /.*(mp3|ogg|wav|mid|midi|pcm)$/;
file_extension_regexp["text"] = /.*(txt|doc|rtf|pdf)$/;

function validate_file(type, value) {
	if (file_extension_regexp[type].test(value) == false) {
		throw "illegal file extension";
	}
}

/* Валидация адреса электронной почты.
	Не забываем ловить исключения.
*/

function validate_email(value) {
	var email_regexp_multiple_dots = /\.(\.)+/g;
	var email_regexp = /^((\d)|([a-zA-Z])|(_)|(\.))*@((\d)|([a-zA-Z]))+\.((\d)|([a-zA-Z]))+$/;
	if (email_regexp_multiple_dots.test(value) == true) {
		throw "illegal email";
	}
	if (email_regexp.test(valie) == false) {
		throw "illegal email";
	}
}

/* Валидация даты.
	Передаём формат dd.mm.yyyy или dd.mmm.yyyy, элементы в любой последовательности.
	Не забываем ловить исключения.
*/

var month_date = {
	"01" : 31, "02" : 29, "03" : 31, "04" : 30,
	"05" : 31, "06" : 30, "07" : 31, "08" : 31,
	"09" : 30, "10" : 31, "11" : 30, "12" : 31,
	"Янв" : 31, "Фев" : 29, "Мар" : 31, "Апр" : 30,
	"Май" : 31, "Июл" : 30, "Июн" : 31, "Авг" : 31,
	"Сен" : 30, "Окт" : 31, "Ноя" : 30, "Дек" : 31
};
function validate_date(format, value) {
	var format_lowercase = format.toLowerCase();
	var day_index = format_lowercase.indexOf("dd");
	var mmm = format_lowercase.indexOf("mmm");
	var month_length = (mmm == -1) ? 2 : 3;
	var month_index = (mmm == -1) ? format_lowercase.indexOf("mm") : mmm;
	var year_index = format_lowercase.indexOf("yyyy");
	if ((day_index == -1) || (month_index == -1) || (year_index == -1)) {
		throw "internal error: date format";
	}
	var value_fixed = value.replace(/(\.|\/|-|\s)/g, ".");
	value_fixed = value_fixed.replace(/(^\d\.)/, "0$1");
	value_fixed = value_fixed.replace(/\.(\d)\./g, ".0$1.");
	var month_svalue = value_fixed.substr(month_index, month_length);
	if (!(month_svalue in month_date)) {
		throw "bad month";
	}
	var day_value = parseInt(value_fixed.substr(day_index, 2));
	if ((day_value < 1) || (day_value > month_date[month_svalue])) {
		throw "bad day";
	}
	var year_value = parseInt(value_fixed.substr(year_index, 4));
	if ((year_value < 1000) || (year_value > 9999)) {
		throw "bad year";
	}
}

/* Фильтрация мата.
	Передаём текст, получаем отфильтрованный (по возможности) вариант.
*/