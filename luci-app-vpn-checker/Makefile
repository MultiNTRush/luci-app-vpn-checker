include $(TOPDIR)/rules.mk

LUCI_TITLE:=VPN-Checker - Subscription Testing Tool
LUCI_DESCRIPTION:=Web interface for testing VPN subscriptions via xray-knife
LUCI_DEPENDS:=+luci-base +rpcd +wget-ssl +unzip +jsonfilter +coreutils-timeout
LUCI_PKGARCH:=all

PKG_BUILD_PARALLEL:=1
PKG_NAME:=luci-app-vpn-checker
PKG_LICENSE:=MIT
PKG_MAINTAINER:=VPN-Checker

include $(TOPDIR)/feeds/luci/luci.mk

# Явная установка прав для всех файлов проекта.
# luci.mk обычно ставит htdocs/root с сохранением прав из git-индекса,
# но при сборке .apk (OpenWrt 25) права могут потеряться, поэтому
# дублируем их явно.

define Package/luci-app-vpn-checker/install
	# --- LuCI JS (статические ресурсы, 0644) ---
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/vpn_checker
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/vpn_checker/main.js \
		$(1)/www/luci-static/resources/view/vpn_checker/main.js

	# --- UCI config (0644) ---
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DATA) ./root/etc/config/vpn-checker $(1)/etc/config/vpn-checker

	# --- init.d (0755, исполняемый) ---
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/vpn-checker $(1)/etc/init.d/vpn-checker

	# --- rpcd handler (0755, исполняемый) ---
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.vpn-checker \
		$(1)/usr/libexec/rpcd/luci.vpn-checker

	# --- LuCI menu (0644) ---
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-vpn-checker.json \
		$(1)/usr/share/luci/menu.d/luci-app-vpn-checker.json

	# --- rpcd ACL (0644) ---
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-vpn-checker.json \
		$(1)/usr/share/rpcd/acl.d/luci-app-vpn-checker.json

	# --- runner.sh (0755, исполняемый) ---
	$(INSTALL_DIR) $(1)/usr/share/vpn-checker
	$(INSTALL_BIN) ./root/usr/share/vpn-checker/runner.sh \
		$(1)/usr/share/vpn-checker/runner.sh

	# --- на всякий случай: каталоги для runtime-данных ---
	$(INSTALL_DIR) $(1)/www/vpn-checker
endef

define Package/luci-app-vpn-checker/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	chmod 0755 /etc/init.d/vpn-checker 2>/dev/null
	chmod 0755 /usr/libexec/rpcd/luci.vpn-checker 2>/dev/null
	chmod 0755 /usr/share/vpn-checker/runner.sh 2>/dev/null
	/etc/init.d/rpcd reload 2>/dev/null
	/etc/init.d/vpn-checker enable 2>/dev/null
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot signature
$(eval $(call BuildPackage,luci-app-vpn-checker))