// Класс-конвертер HTML в RTF.
// Поддерживает тэги: div (в т.ч. с align), li, br, b, i.

/*
Памятка по RegExp.
\\s - пробел или табуляция.
\\s*? - любое количество "белого" пространства.
[\\s\\S]* - любое количество любых символов.
[\\s\\S]*? - любое количество любых символов. Символ '?' означает НЕ жадный поиск.
[^>]*? - любое количество любых символов кроме >.
[^>]*? - любое количество символов.
[\"'] - кавычка, та или другая.
когда regexp задаётся строкой, в нём нужно экранировать все слеши. \ => \\.
\ - экранирование спецсимвола в regexp. \/ => поиск символа /. Из-за экранирования \ в строках приходится писать \\/.
Модификатор g - глобальный поиск, т.е. найти все вхождения, а не только первое.
Модификатор i - регистронезависимый поиск.
*/

function generate(html)
{
    // Вырезать из html тэг body
    var curStr = GetBody(html);
    // Склеить весь код html в одну длинную строку
    curStr = ClearHtml(curStr);

    // Заменить тэги html на rtf-команды
    // Сначала обработаем div'ы с параметром align
    curStr = Process(curStr, "<div[^>]*?align\\s*?=\\s*?[\"']center[\"'][^>]*?>", "<\\/div>", "\\par\n\\qc\n", "\n");
    curStr = Process(curStr, "<div[^>]*?align\\s*?=\\s*?[\"']right[\"'][^>]*?>", "<\\/div>", "\\par\n\\qr\n", "\n");
    // Затем все остальные div'ы
    curStr = Process(curStr, "<div[^>]*?>", "<\\/div>", "\\par\n\\qj\n", "\n");
    // И все остальные интересующие нас тэги
    curStr = Process(curStr, "<li[^>]*?>", "<\\/li>", "\\par\n\\tab ", "");
    curStr = Process(curStr, "<br[^>]*?>", "", "\n\\par\n", "");
    curStr = Process(curStr, "<b[^>]*?>", "<\\/b>", "\\b ", "\\b0 ");
    curStr = Process(curStr, "<i[^>]*?>", "<\\/i>", "\\i ", "\\i0 ");
    
    // Удалить html-комментарии
    curStr = curStr.replace(/<!--[^>]*?-->/gi, "");
    
    // Обработать спецсимволы html
    curStr = curStr.replace(/&lt;/gi, "<");
    curStr = curStr.replace(/&gt;/gi, ">");
    
    // Добавить заголовок rtf
    curStr = "{\\rtf1\\ansi\\ansicpg1251\n" + curStr + "\n}"
    
    return curStr;
};

// Удалить пробелы, табуляции, переносы строк между html-тэгами.
var ClearHtml = function(html)
{
    var result = html.replace(/\n/g, "")
        .replace(/[\t ]+\</g, "<")
        .replace(/\>[\t ]+\</g, "><")
        .replace(/\>[\t ]+$/g, ">");
        
    return result;
};

// Вырезать тэг body из тэга html.
// Если body отсутствует, ничего не делает.
var GetBody = function(html)
{
    var body = html.match(/<body>[\s\S]*?<\/body>/i);

    if(typeof(body) == "undefined" || body == null)
    {
        return html;
    }
    else body = body[0];

    var regBodyStart = new RegExp("<body>", "i");
    body = body.replace(regBodyStart, "");

    var regBodyEnd = new RegExp("<\\/body>", "i");
    body = body.replace(regBodyEnd, "");

    return body;
};

// Заменить html-тэг на заданный набор rtf-команд.
// @input - строка, в которой производится изменение.
// @regStartStr - regexp для поиска открывающего тэга
// @regEndStr - regexp для поиска закрывающего тэга
// @replaceStart - строка, на которую заменить открывающий тэг
// @replaceEnd - строка, на которую заменить закрывающий тэг
var Process = function(input, regStartStr, regEndStr, replaceStart, replaceEnd)
{
    var editedInput = input;

    if(regStartStr != "" && regEndStr != "")
    {
        var anySymbolsStr = "[\\s\\S]*?";
        var regFullStr = regStartStr + anySymbolsStr + regEndStr;
    }
    else if(regStartStr == "" && regStartStr == "")
    {
        return input;
    }
    else
    {
        var regFullStr = regStartStr != "" ? regStartStr : regEndStr;
    }

    var regFull = new RegExp(regFullStr, "gi");
    var allFinds = editedInput.match(regFull);

    if(allFinds == null)
    {
        //console.log("No matches for regextp " + regFullStr);
        return input;
    }

    for(var i = 0; i < allFinds.length; i++)
    {
        var currentStr = allFinds[i];
        var replaceStr = GetReplaceStr(currentStr, regStartStr, regEndStr, replaceStart, replaceEnd);
        var editedStr = editedInput.replace(currentStr, replaceStr);
        editedInput = editedStr;
    }

    return editedInput;
};

// Вспомогательный метод.
// Производит замену regStartStr на replaceStart, regEndStr на replaceEnd в подстроке str.
var GetReplaceStr = function(str, regStartStr, regEndStr, replaceStart, replaceEnd)
{
    if(regStartStr != "")
    {
        var regStart = new RegExp(regStartStr, "gi");
        str = str.replace(regStart, replaceStart);
    }

    if(regEndStr != "")
    {
        var regEnd = new RegExp(regEndStr, "gi");
        str = str.replace(regEnd, replaceEnd);
    }

    return str;
};

exports.generate = generate;