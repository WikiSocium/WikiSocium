# Лицензия проекта

# Описание проекта

# Советы для разработчиков
В .gitignore_global лучше добавить исключение для node_modules, чтобы не сабмитить на github собранные модули

# Настройка среды разработки
1. node.js — https://github.com/joyent/node/wiki/Installation
2. npm (node package manager) — http://npmjs.org/doc/README.html

Теперь надо куда-то склонировать репоиторий, перейти в этом где-то в папочку node и установить необходимые пакеты.
Можно попробовать сделать в директории с app.js "npm install -d" (то есть установить все зависимости из package.json), а можно все поставить руками:

3. express.js (является node package'ом) — http://expressjs.com/guide.html, 
4. jade "npm install jade"
5. now.js http://nowjs.com/download, нас интересует "Install From npm", то есть "npm install now"
6. Теперь пишем "node app.js" и наблюдаем надпись "Express server listening on port 3000 in development mode" (ну если у вас свободен 3000 порт)
7. ???
8. PROFIT!!11