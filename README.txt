####################
# Лицензия проекта #
####################

MIT license, см. license.txt.

####################
# Описание проекта #
####################

ВикиСоциум - сайт-коллекция и конструктор удобных пошаговых решений для общественных проблем (ЖКХ, дороги, защита прав потребителей и т.д.).


############################
# Советы для разработчиков #
############################
В .gitignore_global лучше добавить исключение для node_modules, чтобы не сабмитить на github собранные модули

##############################
# Настройка среды разработки #
##############################

(обновлено 08.06.2012, имеются в виду *nix системы)
*** Установка Ubuntu в VirtualBox под Windows ***
1. Поставить VirtualBox последней версии (https://www.virtualbox.org/wiki/Downloads)
2. Поставить Extention Pack к ней
3. Скачать образ Ubuntu 10.04 или последнюю (12.04) той же битности, что и ваша система. Создать новую виртуальную машину типа Linux + Ubuntu, ОЗУ выбрать 1-2ГБ, далее создать новый жесткий диск расширяемого размера объемом 8ГБ. После установки этот файл займет около 4ГБ
4. После этого iso c Ubuntu подключить как сменный носитель и запустить машину. Загрузка с образа произойдёт автоматически. Установка простая, никаких опций кроме языка выбирать не надо, все стандартно. Попросят ввести пароль, его нужно ввести и не забыть, он нужен при выполнении команд, которые начинаются с sudo.
5. После установки нужно установить дополнения гостевой ОС. Для этого зайти в меню VirtualBox -> Устройства -> Установить дополнения...
На рабочем столе машины появится иконка с диском. Правой кнопкой мыши -> запустить "Открыть с помощью Предложение автозапуска", ввести пароль и ждать.

*** На установленной Ubuntu ***
1. Открыть terminal и выполнить:
sudo apt-get install git python build-essential libssl-dev checkinstall
2. Установить последнюю версию node.js:
wget http://nodejs.org/dist/v0.8.10/node-v0.8.10.tar.gz
tar -zxf node-v0.8.10.tar.gz
cd node-v0.8.10
./configure
make
sudo checkinstall
3. Закрыть терминал и открыть снова. Выполнить команду "node -v". Ответ должен быть v0.8.10. Node установлен.

5. Клонируем репозиторий git и ставим нужные пакеты:
git clone https://github.com/WikiSocium/WikiSocium.git
cd WikiSocium/node
npm install

6. Ставим MongoDB. Мануал: http://proubuntu.com.ua/2012/04/05/mongodb-2-0-4.html
7. Опять заходим в терминал, где ставился node, мы должны находиться в папке ~/WikiSocium/node. Выполняем команду node app.js. Должен работать сайт и регистрация с авторизацией.
Должна быть видна надпись "Express server listening on port 3000 in development mode"

!!!Под Windows!!!
1. Идем на http://nodejs.org и скачиваем node. На главной большая кнопка install
2. Устанавливаем nodejs
3. Скачиваем git для windows: http://msysgit.github.com/. 
Я там выбираю Git for Windows и иду в downloads on google code 
(http://code.google.com/p/msysgit/downloads/list?q=full+installer+official+git)
Там выбираю самую свежую версию
4. Устанавливаем Git
5. Нажимаем правой кнопкой по папке, в которую положим рабочую папку с кодом. Выбираем Git Bash Here
6. Клонируем репозиторий git и ставим нужные пакеты:
git clone https://github.com/WikiSocium/WikiSocium.git
cd WikiSocium/node
npm install


#################
# Как работать? #
#################
Git устроен таким образом, чтобы минимизировать интерференцию от чужого кода до момента мерджа. Поэтому нужно делать бранчи. Если вы работаете над какой-то фичей — делайте для нее бранч. О том как это делать — http://book.git-scm.com/3_basic_branching_and_merging.html, http://book.git-scm.com/3_distributed_workflows.html.

Так как все мы будем добавлены как коллабораторы (то есть каждый будет иметь возможность непосредственно пушить свои коммиты в глобальное хранилище, что увеличит скорость разработки), то форки не очень уместны. Но все же, так как в дальнейшем они могут понадобиться, стоит ознакомиться с ними здесь: http://help.github.com/fork-a-repo/. Вкратце, форк — это создание копии проекта, владельцем которого являетесь вы. После того, как вы закоммитили и, что самое главное, запушили в него какие-то изменения, можно сделать pull request "родительскому" проект, который представляет из себя нотификацию: "я тут кой-чего сделал, если вам это надо, можете перенести себе". 

То есть алгоритм таков:
0. создать аккаунт на github и настроить ssl по инструкции отсюда: http://help.github.com/linux-set-up-git/
1. сделать watch на проект WikiSocium
2. настроить среду разработки
3. добавить в html_trash папочку со своим ником/именем/номером паспорта и положить туда написанный к данному моменту код
4. сделать commit всего этого (в свой локальный репозиторий)
5. активно пнуть кого-нибудь, кто может добавить вас к проекту, разрешил делать push
6. сделать push своих коммитов (в remote repo), проверить, что изменени стали видны на сайте
7. создать локальный бранч для текущей задачи (git branch MyBranchName), переключиться на него (git checkout MyBranchName) и решить там свою задачу
8. сделать merge (git merge master) master-бранча со своим (чтобы перенести изменения, которые были внесены в master), убедиться, что все ок и ничего не сломалось
9. переключиться на master-бранч, замержить изменения из своего бранча в master
10. сделать push master-бранча

Если при решении текущей задачи возникают какие-то проблемы, то есть смысл поделиться своим бранчом со всеми. Для этого надо сделать push его в проект, после чего все смогут увидеть этот бранч на guthub, склонировать себе и помочь.

##########################################
# Как построить процесс создания версий? #
##########################################
С учетом того, что у нас много народу и много разрозненных фичей, которые хотелось бы когда-нибудь включить в проект, можно поступить следующим образом. Как только будут какого-то рода milestones на обозримое будущее, можно будет выделить содержимое ближайших версий и тут же сделать для них бранчи, и люди, делающие фичи, которые будут включены в будущую версию, но не будут включены в текушую, будут комитить свои изменения в бранч будущей версии. Как только итерация текущей версии завершится, на нее вешается tag с номером версии, изменения мерджатся в бранч следующей версии и все работают уже с ним.