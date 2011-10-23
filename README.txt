# Лицензия проекта

# Описание проекта

# Советы для разработчиков
В .gitignore_global лучше добавить исключение для node_modules, чтобы не сабмитить на github собранные модули

# Настройка среды разработки
1. node.js — https://github.com/joyent/node/wiki/Installation
2. npm (node package manager) — http://npmjs.org/doc/README.html

Теперь надо куда-то склонировать репозиторий, перейти в этом где-то в папочку node и установить необходимые пакеты.
Можно попробовать сделать в директории с app.js "npm install -d" (то есть установить все зависимости из package.json), а можно все поставить руками:

3. express.js (является node package'ом) — http://expressjs.com/guide.html, 
4. jade "npm install jade"
5. now.js http://nowjs.com/download, нас интересует "Install From npm", то есть "npm install now"

Так или иначе, все зависимости установлены, можно запускать сервер:
6. Теперь пишем "node app.js" и наблюдаем надпись "Express server listening on port 8080 in development mode"
7. Открываем браузер, пишем localhost:8080, появляется надпись, мол, Express вас приветствует.

# Что можно посмотреть?
Как организуется работа с запросами и передачей json'а в шаблон.
/templates/testCase/
/templates/testCase/0/

# Как работать?
Git устроен таким образом, чтобы минимизировать интерференцию от чужого кода до момента мерджа. Поэтому нужно делать бранчи. Если вы работаете над какой-то фичей — делайте для нее бранч. О том как это делать — http://book.git-scm.com/3_basic_branching_and_merging.html, http://book.git-scm.com/3_distributed_workflows.html.

Нормальный воркфлоу следующий:
1. Колнируете master бранч
2. Делаете локальный бранчи со своими текущими задачами
3. Переключаетесь на master, делаете merge с бранчем готовой задачи
4. Делаете push в удаленный репозиторий