// �����-��������� HTML � RTF.
// ������������ ����: div (� �.�. � align), li, br, b, i.

/*
������� �� RegExp.
\\s - ������ ��� ���������.
\\s*? - ����� ���������� "������" ������������.
[\\s\\S]* - ����� ���������� ����� ��������.
[\\s\\S]*? - ����� ���������� ����� ��������. ������ '?' �������� �� ������ �����.
[^>]*? - ����� ���������� ����� �������� ����� >.
[^>]*? - ����� ���������� ��������.
[\"'] - �������, �� ��� ������.
����� regexp ������� �������, � �� ����� ������������ ��� �����. \ => \\.
\ - ������������� ����������� � regexp. \/ => ����� ������� /. ��-�� ������������� \ � ������� ���������� ������ \\/.
����������� g - ���������� �����, �.�. ����� ��� ���������, � �� ������ ������.
����������� i - ������������������� �����.
*/

function generate(html)
{
    // �������� �� html ��� body
    var curStr = GetBody(html);
    // ������� ���� ��� html � ���� ������� ������
    curStr = ClearHtml(curStr);

    // �������� ���� html �� rtf-�������
    // ������� ���������� div'� � ���������� align
    curStr = Process(curStr, "<div[^>]*?align\\s*?=\\s*?[\"']center[\"'][^>]*?>", "<\\/div>", "\\par\n\\qc\n", "\n");
    curStr = Process(curStr, "<div[^>]*?align\\s*?=\\s*?[\"']right[\"'][^>]*?>", "<\\/div>", "\\par\n\\qr\n", "\n");
    // ����� ��� ��������� div'�
    curStr = Process(curStr, "<div[^>]*?>", "<\\/div>", "\\par\n\\qj\n", "\n");
    // � ��� ��������� ������������ ��� ����
    curStr = Process(curStr, "<li[^>]*?>", "<\\/li>", "\\par\n\\tab ", "");
    curStr = Process(curStr, "<br[^>]*?>", "", "\n\\par\n", "");
    curStr = Process(curStr, "<b[^>]*?>", "<\\/b>", "\\b ", "\\b0 ");
    curStr = Process(curStr, "<i[^>]*?>", "<\\/i>", "\\i ", "\\i0 ");
    
    // ������� html-�����������
    curStr = curStr.replace(/<!--[^>]*?-->/gi, "");
    
    // ���������� ����������� html
    curStr = curStr.replace(/&lt;/gi, "<");
    curStr = curStr.replace(/&gt;/gi, ">");
    
    // �������� ��������� rtf
    curStr = "{\\rtf1\\ansi\\ansicpg1251\n" + curStr + "\n}"
    
    return curStr;
};

// ������� �������, ���������, �������� ����� ����� html-������.
var ClearHtml = function(html)
{
    var result = html.replace(/\n/g, "")
        .replace(/[\t ]+\</g, "<")
        .replace(/\>[\t ]+\</g, "><")
        .replace(/\>[\t ]+$/g, ">");
        
    return result;
};

// �������� ��� body �� ���� html.
// ���� body �����������, ������ �� ������.
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

// �������� html-��� �� �������� ����� rtf-������.
// @input - ������, � ������� ������������ ���������.
// @regStartStr - regexp ��� ������ ������������ ����
// @regEndStr - regexp ��� ������ ������������ ����
// @replaceStart - ������, �� ������� �������� ����������� ���
// @replaceEnd - ������, �� ������� �������� ����������� ���
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

// ��������������� �����.
// ���������� ������ regStartStr �� replaceStart, regEndStr �� replaceEnd � ��������� str.
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