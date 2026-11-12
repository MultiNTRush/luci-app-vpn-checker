# LuCI App VPN Checker

Приложение для веб-интерфейса LuCI в **OpenWrt**, предназначенное для проверки статуса и управления VPN-подключениями.

Поддерживаются все актуальные версии OpenWrt:
* **OpenWrt 24.10+** (установка пакетов `.ipk` через `opkg`)
* **OpenWrt 25.12+** (установка пакетов `.apk` через `apk`)

---

## Установка и обновление

Подключитесь к роутеру по SSH и выполните одну команду. Скрипт сам определит архитектуру процессора, нужный формат пакета (`.ipk` или `.apk`) и установит последнюю версию из релизов:

```sh
sh <(wget -O - https://raw.githubusercontent.com/MultiNTRush/luci-app-vpn-checker/main/install.sh)
```

### Если возникает ошибка скачивания по HTTPS
На некоторых сборках OpenWrt 24.10+ и ниже в системе отсутствуют сертификаты для работы `wget` с `https://`. В этом случае выполните команду:

```sh
opkg update && opkg install ca-bundle libustream-mbedtls && sh <(wget -O - https://raw.githubusercontent.com/MultiNTRush/luci-app-vpn-checker/main/install.sh)
```

После завершения установки обновите страницу веб-интерфейса LuCI в браузере (или перезайдите в панель управления), чтобы новый раздел появился в меню.

---

## Ручная установка

1. Перейдите в раздел [**Releases**](https://github.com/MultiNTRush/luci-app-vpn-checker/releases) и скачайте файл для архитектуры вашего роутера:
   * `.ipk` — для OpenWrt 24.10 и ниже
   * `.apk` — для OpenWrt 25.12 и выше
2. Загрузите скачанный файл в папку `/tmp` на роутере (через SCP или веб-интерфейс LuCI: *Система -> Менеджер пакетов -> Загрузить пакет*).
3. Установите пакет через терминал:

**Для OpenWrt 24.10+ (`opkg`):**
```sh
opkg update
opkg install /tmp/luci-app-vpn-checker_*.ipk
```

**Для OpenWrt 25.12+ (`apk`):**
```sh
apk update
apk add --allow-untrusted /tmp/luci-app-vpn-checker*.apk
```

---

## Удаление

Чтобы полностью удалить приложение с роутера, выполните в терминале команду для вашего пакетного менеджера:

* **Для `opkg`:**
  ```sh
  opkg remove luci-app-vpn-checker
  ```
* **Для `apk`:**
  ```sh
  apk del luci-app-vpn-checker
  ```
