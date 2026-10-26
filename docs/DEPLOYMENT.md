# Инструкция по деплою и сопровождению VPS (OSTAP TV)

Документ описывает серверное окружение, конфигурацию сервисов, процедуры обновления и устранения неполадок на боевом сервере **OSTAP TV**.

---

## 1. Спецификация серверного окружения

* **IP-адрес сервера:** `2.26.103.102`
* **Пользователь SSH:** `root`
* **Операционная система:** Ubuntu Linux
* **Директория веб-сайта:** `/var/www/ostap-tv/`
* **Основной Git-репозиторий:** `https://github.com/ossiris11/ossiris11.github.io.git` (ветка `main`)

---

## 2. Карта портов и сервисов

| Порт | Сервис | Внутренний адрес | Назначение |
| :--- | :--- | :--- | :--- |
| **80** | Nginx Web Server | `0.0.0.0:80` | Раздача статики веб-приложения и стартового файла MSX |
| **8090** | Nginx Stream Proxy | `0.0.0.0:8090` | Проксирование потоков TorrServer с CORS-заголовками для плеера |
| **8091** | TorrServer MatriX | `127.0.0.1:8091` | Движок стриминга торрентов (бинарник `/usr/local/bin/torrserver`) |
| **8088** | Jackett | `127.0.0.1:8088` | Торрент-парсер трекеров |

---

## 3. Конфигурация Nginx (`/etc/nginx/sites-available/default`)

Ключевые блоки конфигурации:

```nginx
# 1. Основной сайт (порт 80)
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/ostap-tv;
    index index.html;
    server_name _;

    # Сжатие gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    # CORS заголовки
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header Access-Control-Allow-Headers * always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Стартовый параметр для Media Station X
    location /msx/start.json {
        default_type application/json;
        add_header Access-Control-Allow-Origin * always;
    }

    # Прокси парсера Jackett с кэшированием
    location /jackett/ {
        proxy_pass http://127.0.0.1:8088/jackett/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache jackett_cache;
        proxy_cache_valid 200 15m;
    }

    # API TorrServer
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8091/;
        proxy_buffering off;
        proxy_read_timeout 300s;
        add_header Access-Control-Allow-Origin * always;
    }

    # ПОЛНЫЙ ЗАПРЕТ КЭШИРОВАНИЯ ДЛЯ СКРИПТОВ И СТИЛЕЙ
    location ~* \.(js|css)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        add_header Access-Control-Allow-Origin * always;
    }
}

# 2. Выделенный стрим-прокси TorrServer (порт 8090)
server {
    listen 8090;
    listen [::]:8090;
    client_max_body_size 0;

    location / {
        proxy_pass http://127.0.0.1:8091;
        proxy_buffering off;
        proxy_read_timeout 300s;

        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE, HEAD' always;
        add_header Access-Control-Allow-Headers * always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Content-Length 0;
            return 204;
        }
    }
}
```

---

## 4. Пошаговая инструкция по деплою изменений

После внесения правок в локальном репозитории выполните следующие шаги:

### Шаг 1. Проверка синтаксиса JavaScript
```bash
node -c app.min.js
```
*Убедитесь, что команда завершается с кодом 0 без ошибок.*

### Шаг 2. Загрузка файлов на сервер VPS
```bash
# Загрузка основного скрипта, стилей и точки входа:
scp -o StrictHostKeyChecking=no app.min.js index.html root@2.26.103.102:/var/www/ostap-tv/
scp -o StrictHostKeyChecking=no css/custom.css root@2.26.103.102:/var/www/ostap-tv/css/
```

### Шаг 3. Перезагрузка Nginx (при изменении конфигов веб-сервера)
```bash
ssh root@2.26.103.102 "nginx -t && systemctl reload nginx"
```

### Шаг 4. Коммит и синхронизация с GitHub
```bash
git add .
git commit -m "Описание внесенных изменений"
git push origin main
```

### Шаг 5. Проверка заголовков ответа
```bash
curl -I http://2.26.103.102/app.min.js
curl -I http://2.26.103.102/css/custom.css
```
*Убедитесь в наличии заголовка `Cache-Control: no-store, no-cache, must-revalidate`.*

---

## 5. Диагностика и устранение неполадок

* **Просмотр логов Nginx:**
  ```bash
  ssh root@2.26.103.102 "tail -n 50 /var/log/nginx/error.log"
  ssh root@2.26.103.102 "tail -n 50 /var/log/nginx/access.log"
  ```
* **Проверка статуса TorrServer:**
  ```bash
  ssh root@2.26.103.102 "curl -s http://127.0.0.1:8091/echo"
  # Ожидаемый ответ: MatriX.147.1
  ```
* **Перезапуск сервисов на VPS:**
  ```bash
  ssh root@2.26.103.102 "systemctl restart nginx"
  ssh root@2.26.103.102 "systemctl restart torrserver"
  ```
