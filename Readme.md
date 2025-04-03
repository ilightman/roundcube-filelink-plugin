# Roundcube filelink plugin
Плагин для загрузки вложений локально на сервер и добавления ссылки в тело письма, вида:
> Скачать вложение по ссылке: https://mail.example.com/filelink/example_filename.txt

Выглядит как дополнительная кнопка в разделе с добавлением вложений:

![Скриншот с новой кнопкой для загрузки файлов](https://ilightman.ru/static/github/images/roundcube-filelink-plugin/screen2.png)

И добавляет ссылку в тело письма:

![Скриншот с новой кнопкой для загрузки файлов](https://ilightman.ru/static/github/images/roundcube-filelink-plugin/screen3.png)

Присутствует индикация загрузки файлов а также поддержка множественной загрузки:

![Индикация загрузки файлов и множественная загрузка](https://ilightman.ru/static/github/images/roundcube-filelink-plugin/screen5.png)

---
# Установка

1. Скопировать содержимое папки plugins в папку plugins Вашего Roundcube.
(папка может находитя например тут: ```/usr/share/roundcube/plugins/```)

2. Создать директорию в вашей системе для хранения загруженных файлов:

    Веб-сервер (например, Apache или Nginx) должен иметь права на запись в эту директорию. Например:
    ```sh
    sudo mkdir -p /путь/где/будут/сохраняться/вложения
    sudo chown www-data:www-data /путь/где/будут/сохраняться/вложения
    sudo chmod 755 /путь/где/будут/сохраняться/вложения
    ```

3. В конфиге плагина ```filelink_custom/config.inc.php``` изменить 2 переменные:
    ```php
    'filelink_custom_upload_dir' - /путь/где/будут/сохраняться/вложения
    ```
    ```php
    'filelink_custom_base_url' - https://домен-почты/filelink
    ```
3. Добавить в Nginx или Apache
    - nginx
        ```nginx
        location /filelink/ {
            alias /путь/где/будут/сохраняться/вложения/;
            autoindex on;
        }
        ```
    - apache
        ```apache
        Alias /filelink /путь/где/будут/сохраняться/вложения

        <Directory /путь/где/будут/сохраняться/вложения>
            Options Indexes FollowSymLinks
            AllowOverride None
            Require all granted
        </Directory>
        ```
3. Выставить ограничения на максимальный размер загружаемых файлов 
    - php (php.ini)
        ```ini
        upload_max_filesize = 10M # например 300 мегабайт
        post_max_size = 10M
        ```
    - nginx

        добавить эту строку в блок http, server или location, где расположен Roundcube.
        ```nginx
        client_max_body_size 10M;
        ```
    - apache

        в файле ```.htaccess``` в директории Roundcube
        ```apache
        <IfModule mod_php7.c>
            php_value upload_max_filesize 10M
            php_value post_max_size 10M
            php_value memory_limit 128M
        </IfModule>

        <IfModule mod_php8.c>
            php_value upload_max_filesize 10M
            php_value post_max_size 10M
            php_value memory_limit 128M
        </IfModule>
        ```
4. Добавить в основной конфиг Roundcube установленный плагин:
    ```php 
    // PLUGINS
    $config['plugins'] = [
        'filelink_custom', 
        // другие плагины... 
    ];
    ```
5. Перезагрузите веб сервер:
    ```bash
    #nginx
    sudo systemctl reload nginx

    #apache
    sudo systemctl reload apache2
    ```
6. Если не заработало сразу нужно дополнительно очистить кэш Roundcube
    ```bash
    sudo rm -rf /usr/share/roundcube/temp/*
    ```
