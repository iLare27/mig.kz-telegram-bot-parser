# Инструкция по настройке и запуску бота

## 🚀 Быстрый старт (простая версия)

Если вы хотите быстро протестировать бота без настройки базы данных:

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте токен бота:**
   - Откройте файл `config.env`
   - Замените `your_bot_token_here` на ваш токен от @BotFather

3. **Запустите простую версию бота:**
   ```bash
   npm run start:simple
   ```

4. **Протестируйте бота:**
   - Найдите вашего бота в Telegram
   - Отправьте команду `/start`
   - Попробуйте команды `/rate`, `/settings`, `/help`

## 🗄️ Полная версия с базой данных

### 1. Установка PostgreSQL

**Windows:**
- Скачайте PostgreSQL с [официального сайта](https://www.postgresql.org/download/windows/)
- Установите с паролем `password` (или измените в config.env)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Создание базы данных

```bash
# Подключитесь к PostgreSQL
sudo -u postgres psql

# Создайте базу данных
CREATE DATABASE currency_bot;

# Создайте пользователя (если нужно)
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE currency_bot TO postgres;

# Выйдите из psql
\q
```

### 3. Настройка переменных окружения

Отредактируйте файл `config.env`:

```env
# Bot Configuration
BOT_TOKEN=ваш_токен_бота

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=currency_bot

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_PER_SECOND=30

# Currency Update Interval (in minutes)
CURRENCY_UPDATE_INTERVAL=60

# Notification Check Interval (in minutes)
NOTIFICATION_CHECK_INTERVAL=60
```

### 4. Запуск полной версии

```bash
# Сборка проекта
npm run build

# Запуск бота
npm start
```

## 🐳 Запуск через Docker

### 1. Установка Docker

Установите Docker Desktop с [официального сайта](https://www.docker.com/products/docker-desktop/)

### 2. Настройка

Отредактируйте файл `config.env` для Docker:

```env
BOT_TOKEN=ваш_токен_бота
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=currency_bot
LOG_LEVEL=info
```

### 3. Запуск

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f bot

# Остановка
docker-compose down
```

## 🔧 Получение токена бота

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например, "Currency Tracker Bot")
4. Введите username бота (например, "currency_tracker_bot")
5. Скопируйте полученный токен
6. Вставьте токен в файл `config.env`

## 📊 Проверка работы

### Тестовые команды:

- `/start` - Приветствие и регистрация
- `/rate` - Текущий курс доллара
- `/settings` - Настройки уведомлений
- `/help` - Справка

### Проверка логов:

```bash
# В режиме разработки
npm run dev

# В продакшене
tail -f logs/app.log
```

## 🚨 Устранение неполадок

### Ошибка подключения к базе данных:

1. Проверьте, что PostgreSQL запущен
2. Проверьте настройки в `config.env`
3. Убедитесь, что база данных создана

### Ошибка токена бота:

1. Проверьте правильность токена
2. Убедитесь, что бот не заблокирован
3. Попробуйте создать нового бота

### Ошибки парсинга:

1. Проверьте доступность сайта mig.kz
2. Обновите селекторы в `src/parsers/migParser.ts`
3. Проверьте логи на ошибки

## 📈 Мониторинг

### Логи:

- **Уровень info**: Обычные операции
- **Уровень warn**: Предупреждения
- **Уровень error**: Ошибки

### Метрики:

- Количество пользователей
- Активные уведомления
- Время отклика команд
- Ошибки парсинга

## 🔄 Обновление

```bash
# Остановите бота
npm run stop

# Обновите код
git pull

# Переустановите зависимости
npm install

# Пересоберите проект
npm run build

# Запустите бота
npm start
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи на ошибки
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки в `config.env`
4. Создайте issue в репозитории с описанием проблемы
