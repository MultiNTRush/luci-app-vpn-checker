include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vpn-checker
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=VPN-Checker
PKG_LICENSE:=MIT
PKG_BUILD_PARALLEL:=1

LUCI_TITLE:=VPN-Checker - Subscription Testing Tool
LUCI_DESCRIPTION:=Web interface for testing VPN subscriptions via xray-knife
LUCI_DEPENDS:=+luci-base +rpcd +wget-ssl +unzip +jsonfilter +coreutils-timeout
LUCI_PKGARCH:=all

# Защита настроек пользователя при обновлении пакета
define Package/luci-app-vpn-checker/conffiles
/etc/config/vpn-checker
endef

# Дополнительный скрипт после установки: выставляем права и перезапускаем службы
define Package/luci-app-vpn-checker/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	chmod 0755 /etc/init.d/vpn-checker 2>/dev/null
	chmod 0755 /usr/libexec/rpcd/luci.vpn-checker 2>/dev/null
	chmod 0755 /usr/share/vpn-checker/runner.sh 2>/dev/null
	mkdir -p /www/vpn-checker 2>/dev/null
	rm -f /tmp/luci-indexcache /tmp/luci-modulecache/* 2>/dev/null
	/etc/init.d/rpcd reload 2>/dev/null
	/etc/init.d/vpn-checker enable 2>/dev/null
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
