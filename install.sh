#!/bin/sh

REPO="MultiNTRush/luci-app-vpn-checker"
PKG_NAME="luci-app-vpn-checker"

# 1. Определяем пакетный менеджер
if command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"
    EXT="apk"
elif command -v opkg >/dev/null 2>&1; then
    PKG_MGR="opkg"
    EXT="ipk"
else
    echo "Ошибка: не найден пакетный менеджер."
    exit 1
fi

echo "Менеджер пакетов: $PKG_MGR (.$EXT)"

# 2. Запрашиваем API последнего релиза (правильный эндпоинт)
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
RELEASE_JSON=$(wget -qO- "$API_URL")

if [ -z "$RELEASE_JSON" ]; then
    echo "Ошибка: не удалось получить данные релиза с GitHub API."
    exit 1
fi

# 3. Извлекаем browser_download_url для файла с нужным расширением
# Ищем .apk или .ipk в массиве assets
LATEST_URL=$(echo "$RELEASE_JSON" | \
    grep -o '"browser_download_url": *"[^"]*\.'${EXT}'"' | \
    head -n 1 | \
    cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
    echo "Ошибка: в последнем релизе нет файла .$EXT."
    echo "Проверь, что релиз создан и к нему прикреплён пакет."
    exit 1
fi

echo "Найден пакет: $LATEST_URL"

# 4. Скачиваем
TMP_PKG="/tmp/${PKG_NAME}.${EXT}"
echo "Скачивание..."
if ! curl -fsSL -o "$TMP_PKG" "$LATEST_URL"; then
    echo "Ошибка при скачивании."
    exit 1
fi

# 5. Устанавливаем (apk принимает только локальный путь, не URL)
echo "Установка..."
if [ "$PKG_MGR" = "apk" ]; then
    apk update
    apk add --allow-untrusted "$TMP_PKG"
else
    opkg update
    opkg install "$TMP_PKG"
fi

rm -f "$TMP_PKG"
echo "Готово."
