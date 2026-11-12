#!/bin/sh

REPO="MultiNTRush/luci-app-vpn-checker"
PKG_NAME="luci-app-vpn-checker"

# 1. Определяем пакетный менеджер (apk или opkg)
if command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"
    EXT="apk"
elif command -v opkg >/dev/null 2>&1; then
    PKG_MGR="opkg"
    EXT="ipk"
else
    echo "Ошибка: не найден пакетный менеджер (ни apk, ни opkg)."
    exit 1
fi

echo "Обнаружен менеджер пакетов: $PKG_MGR (формат .$EXT)"

# 2. Ищем ссылку на нужный файл в последнем релизе на GitHub
LATEST_URL=$(wget -qO- "https://github.com" | \
    grep "browser_download_url" | \
    grep "\.${EXT}\"" | \
    cut -d '"' -f 4 | head -n 1)

if [ -z "$LATEST_URL" ]; then
    echo "Ошибка: файл .$EXT не найден в последнем релизе."
    exit 1
fi

# 3. Скачиваем и устанавливаем пакет
TMP_PKG="/tmp/${PKG_NAME}.${EXT}"
echo "Скачивание $LATEST_URL..."
wget -qO "$TMP_PKG" "$LATEST_URL"

if [ $? -ne 0 ]; then
    echo "Ошибка при скачивании файла."
    exit 1
fi

echo "Установка пакета..."
if [ "$PKG_MGR" = "apk" ]; then
    apk update
    apk add --allow-untrusted "$TMP_PKG"
else
    opkg update
    opkg install "$TMP_PKG"
fi

# 4. Очистка временных файлов
rm -f "$TMP_PKG"
echo "Установка завершена успешно!"
