'use strict';
'require view';
'require form';
'require ui';
'require rpc';
'require poll';

var callGetGroups = rpc.declare({ object: 'luci.vpn-checker', method: 'get_groups', expect: { '': {} } });
var callSaveGroup = rpc.declare({ object: 'luci.vpn-checker', method: 'save_group', params: ['payload'], expect: { '': {} } });
var callDeleteGroup = rpc.declare({ object: 'luci.vpn-checker', method: 'delete_group', params: ['cfg'], expect: { '': {} } });
var callBinaryStatus = rpc.declare({ object: 'luci.vpn-checker', method: 'get_binary_status', expect: { '': {} } });
var callCheckBinaryUpdate = rpc.declare({ object: 'luci.vpn-checker', method: 'check_binary_update', expect: { '': {} } });
var callRemoveBinary = rpc.declare({ object: 'luci.vpn-checker', method: 'remove_binary', expect: { '': {} } });
var callDownload = rpc.declare({ object: 'luci.vpn-checker', method: 'download_binary', expect: { '': {} } });
var callServiceAction = rpc.declare({ object: 'luci.vpn-checker', method: 'service_action', params: ['action'], expect: { '': {} } });
var callServiceStatus = rpc.declare({ object: 'luci.vpn-checker', method: 'get_service_status', expect: { '': {} } });
var callCompat = rpc.declare({ object: 'luci.vpn-checker', method: 'get_compat', expect: { '': {} } });
var callCpuLoad = rpc.declare({ object: 'luci.vpn-checker', method: 'get_cpu_load', expect: { '': {} } });
var callStats = rpc.declare({ object: 'luci.vpn-checker', method: 'get_stats', expect: { '': {} } });
var callLog = rpc.declare({ object: 'luci.vpn-checker', method: 'get_log', params: ['lines', 'file'], expect: { '': {} } });
var callClearLog = rpc.declare({ object: 'luci.vpn-checker', method: 'clear_log', expect: { '': {} } });
var callForceCheck = rpc.declare({ object: 'luci.vpn-checker', method: 'force_check', params: ['cfg'], expect: { '': {} } });
var callForceCheckAll = rpc.declare({ object: 'luci.vpn-checker', method: 'force_check_all', expect: { '': {} } });
var callImportConfig = rpc.declare({ object: 'luci.vpn-checker', method: 'import_config', params: ['content'], expect: { '': {} } });
var callToggleGroup = rpc.declare({ object: 'luci.vpn-checker', method: 'toggle_group', params: ['cfg', 'enabled'], expect: { '': {} } });
var callCheckUrlAvailable = rpc.declare({ object: 'luci.vpn-checker', method: 'check_url_available', params: ['url'], expect: { '': {} } });

// ============================================================
// CSS
// ============================================================
var CSS_ID = 'vpn-checker-styles';
if (!document.getElementById(CSS_ID)) {
	var st = document.createElement('style');
	st.id = CSS_ID;
	st.textContent = [
		'.cbi-map { width: 100% !important; max-width: 100% !important; }',
		'.cbi-map > .cbi-section, .cbi-map > .cbi-tabmenu { width: 100% !important; max-width: 100% !important; }',
		'.cbi-tabmenu { display: flex; width: 100%; }',
		'.cbi-tabmenu > li { flex: 0 0 auto; }',

		'.vpn-checker-page { width: 100% !important; max-width: 100% !important; }',
		'.vpn-checker-page .cbi-map, .vpn-checker-page .cbi-section { width: 100% !important; max-width: 100% !important; }',
		'.vpn-checker-page table.table { width: 100% !important; table-layout: auto; }',
		'.vpn-checker-page table.table th, .vpn-checker-page table.table td { text-align: center !important; vertical-align: middle; white-space: nowrap; }',
		'.vpn-checker-page .vpn-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: center; }',
		'.vpn-checker-page .vpn-actions .btn { margin: 0; }',
		'.vpn-checker-page .vpn-link { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; }',
		'.vpn-checker-page .vpn-link a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }',
		'.vpn-checker-page .vpn-copy-btn { padding: 1px 6px; font-size: 11px; line-height: 1.2; }',
		'.vpn-checker-page .vpn-status-ok { color: var(--success-color-medium, #2a7d2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-status-err { color: var(--error-color-medium, #b02a2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-status-warn { color: var(--warn-color-medium, #b07a2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-count-ok { color: var(--success-color-medium, #2a7d2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-count-zero { color: var(--error-color-medium, #b02a2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-muted { color: var(--text-color-medium, #888); font-style: italic; }',
		'.vpn-checker-page .vpn-busy { opacity: 0.6; pointer-events: none; }',
		'.vpn-checker-page .vpn-field-hint { color: var(--error-color-medium, #b02a2a); font-size: 11px; margin-top: 2px; }',
		'.vpn-checker-page .vpn-spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: vpn-spin 0.8s linear infinite; vertical-align: -2px; margin-right: 4px; }',
		'@keyframes vpn-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }',

		// динамический список подписок / check_urls
		'.vpn-checker-page .vpn-dynlist { display: flex; flex-direction: column; gap: 6px; width: 100%; }',
		'.vpn-checker-page .vpn-dynlist .vpn-dynlist-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; grid-template-areas: "field marker del" "hint hint hint"; gap: 4px 8px; align-items: center; }',
		'.vpn-checker-page .vpn-dynlist .vpn-dynlist-field { grid-area: field; min-width: 0; }',
		'.vpn-checker-page .vpn-dynlist .add-item.control-group { display: flex; align-items: stretch; width: 100%; }',
		'.vpn-checker-page .vpn-dynlist .add-item.control-group input.cbi-input-text { flex: 1 1 auto; min-width: 0; margin: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }',
		'.vpn-checker-page .vpn-dynlist .add-item.control-group .btn.cbi-button-add { flex: 0 0 auto; margin: 0; min-width: 2.4em; padding: 0 8px; border-top-left-radius: 0; border-bottom-left-radius: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; cursor: pointer; }',
		'.vpn-checker-page .vpn-dynlist .vpn-dynlist-del { grid-area: del; margin: 0; padding: 2px 8px; line-height: 1.2; }',
		'.vpn-checker-page .vpn-url-marker { grid-area: marker; display: inline-block; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.2) inset; }',
		'.vpn-checker-page .vpn-url-marker--unknown { background: var(--text-color-medium, #888); opacity: 0.5; }',
		'.vpn-checker-page .vpn-url-marker--checking { background: var(--warn-color-medium, #b07a2a); animation: vpn-url-pulse 1s linear infinite; }',
		'.vpn-checker-page .vpn-url-marker--ok { background: var(--success-color-medium, #2a7d2a); }',
		'.vpn-checker-page .vpn-url-marker--err { background: var(--error-color-medium, #b02a2a); }',
		'@keyframes vpn-url-pulse { 50% { opacity: 0.35; } }',
		'.vpn-checker-page .vpn-url-hint { grid-area: hint; font-size: 11px; color: var(--text-color-medium, #888); min-height: 12px; }',
		'.vpn-checker-page .vpn-url-hint--ok { color: var(--success-color-medium, #2a7d2a); }',
		'.vpn-checker-page .vpn-url-hint--err { color: var(--error-color-medium, #b02a2a); }',

		'.vpn-checker-page .vpn-interval-row { display: inline-flex; align-items: center; gap: 6px; }',
		'.vpn-checker-page .vpn-interval-row input.cbi-input-text { width: 6em; margin: 0; }',
		'.vpn-checker-page .vpn-interval-row select.cbi-input-select { width: auto; margin: 0; }',

		'.vpn-checker-page .vpn-groups-table { width: 100% !important; table-layout: fixed; }',
		'.vpn-checker-page .vpn-groups-table th, .vpn-checker-page .vpn-groups-table td { text-align: center !important; vertical-align: middle; padding: 6px 8px; }',
		'.vpn-checker-page .vpn-groups-table td.vpn-grp-actions { white-space: nowrap; }',

		'.vpn-checker-page .vpn-dash { margin-bottom: 8px; }',
		'.vpn-checker-page .vpn-dash > h3 { display: none; }',
		'.vpn-checker-page .vpn-dash-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; }',
		'.vpn-checker-page .vpn-dash-table th, .vpn-checker-page .vpn-dash-table td { text-align: left !important; vertical-align: top; padding: 4px 8px; border-bottom: 1px solid var(--border-color-low, rgba(128,128,128,0.2)); }',
		'.vpn-checker-page .vpn-dash-table th { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-color-medium, #888); background: var(--background-color-low, rgba(128,128,128,0.06)); padding: 5px 8px; }',
		'.vpn-checker-page .vpn-dash-table tr:last-child td { border-bottom: none; }',
		'.vpn-checker-page .vpn-dash-table .vpn-k { color: var(--text-color-medium, #888); font-size: 11px; margin-right: 4px; }',
		'.vpn-checker-page .vpn-dash-table .vpn-v { color: var(--text-color-highest, inherit); font-weight: 600; }',
		'.vpn-checker-page .vpn-dash-table .vpn-row { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; line-height: 1.5; }',
		'.vpn-checker-page .vpn-dash-table .vpn-row + .vpn-row { margin-top: 1px; }',
		'@media (max-width: 700px) {',
		'  .vpn-checker-page .vpn-dash-table, .vpn-checker-page .vpn-dash-table thead, .vpn-checker-page .vpn-dash-table tbody, .vpn-checker-page .vpn-dash-table th, .vpn-checker-page .vpn-dash-table td, .vpn-checker-page .vpn-dash-table tr { display: block; width: 100%; }',
		'  .vpn-checker-page .vpn-dash-table thead { display: none; }',
		'  .vpn-checker-page .vpn-dash-table tr { border-bottom: 1px solid var(--border-color-low, rgba(128,128,128,0.2)); padding: 4px 0; }',
		'  .vpn-checker-page .vpn-dash-table td { border: none; padding: 2px 8px; }',
		'}',

		'.vpn-checker-page .vpn-cell-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }',
		'.vpn-checker-page .vpn-icon-btn { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; min-width: 44px; padding: 3px 4px; margin: 0; border-radius: 4px; line-height: 1; font-size: 10px; cursor: pointer; border: 1px solid var(--border-color-low, rgba(128,128,128,0.3)); background: var(--background-color-low, rgba(128,128,128,0.06)); color: var(--text-color-highest, inherit); transition: background 0.15s ease, opacity 0.15s ease; }',
		'.vpn-checker-page .vpn-icon-btn:hover:not(:disabled) { background: var(--background-color-medium, rgba(128,128,128,0.14)); }',
		'.vpn-checker-page .vpn-icon-btn:disabled, .vpn-checker-page .vpn-icon-btn.vpn-busy { opacity: 0.55; cursor: progress; }',
		'.vpn-checker-page .vpn-icon-btn svg { display: block; width: 14px; height: 14px; }',
		'.vpn-checker-page .vpn-icon-btn .vpn-icon-label { font-size: 10px; line-height: 1.1; white-space: nowrap; }',
		'.vpn-checker-page .vpn-icon-btn-pos { color: var(--success-color-medium, #2a7d2a); }',
		'.vpn-checker-page .vpn-icon-btn-neg { color: var(--error-color-medium, #b02a2a); }',
		'.vpn-checker-page .vpn-icon-btn-warn { color: var(--warn-color-medium, #b07a2a); }',

		'.vpn-checker-page .vpn-stats { margin-top: 22px; border-top: 1px solid var(--border-color-low, rgba(128,128,128,0.2)); padding-top: 12px; }',
		'.vpn-checker-page .vpn-stats-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }',
		'.vpn-checker-page .vpn-stats-head h3 { margin: 0; font-size: 1.35em; font-weight: 700; }',
		'.vpn-checker-page .vpn-stats-head .btn { margin: 0; padding: 2px 10px; font-size: 12px; }',

		'.vpn-checker-page .vpn-logs-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75em; margin-bottom: 0.75em; }',
		'.vpn-checker-page .vpn-logs-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 0.75em; flex: 1 1 auto; min-width: 0; }',
		'.vpn-checker-page .vpn-logs-search { position: relative; display: flex; align-items: center; width: min(280px, 100%); min-width: 0; margin: 0; }',
		'.vpn-checker-page .vpn-logs-search-icon { position: absolute; left: 8px; width: 16px; height: 16px; color: var(--text-color-medium, #888); pointer-events: none; }',
		'.vpn-checker-page .vpn-logs-search-icon svg { display: block; width: 16px; height: 16px; }',
		'.vpn-checker-page .vpn-logs-search-input { box-sizing: border-box; width: 100%; margin: 0 !important; padding-left: 30px !important; }',
		'.vpn-checker-page .vpn-logs-checkbox { display: inline-flex; align-items: center; gap: 0.4em; margin: 0; white-space: nowrap; cursor: pointer; user-select: none; }',
		'.vpn-checker-page .vpn-logs-checkbox input { margin: 0; }',
		'.vpn-checker-page .vpn-logs-actions { display: flex; align-items: center; gap: 0.4em; flex-wrap: wrap; }',
		'.vpn-checker-page .vpn-logs-pane { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }',
		'.vpn-checker-page .vpn-logs-output { display: block; box-sizing: border-box; width: 100% !important; max-width: 100% !important; height: 65vh !important; min-height: 24rem; max-height: none !important; margin: 0; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; border-radius: 4px; font-family: ui-monospace, "Cascadia Mono", "SF Mono", SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace; font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; user-select: text; background: var(--background-color-low, #f8f8f8) !important; color: var(--text-color-highest, inherit) !important; border: 1px solid var(--border-color-low, rgba(128,128,128,0.2)); padding: 8px 10px; }',
		'.vpn-checker-page .vpn-logs-output--empty { opacity: 0.75; font-style: italic; }',
		'.vpn-checker-page .vpn-log-line { display: block; padding: 0 2px; margin: 0; line-height: 1.35; border-radius: 2px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }',
		'.vpn-checker-page .vpn-log-sep { color: var(--primary-color-high, #2a7d2a); font-weight: 700; background: var(--background-color-low, rgba(42,125,42,0.08)); margin-top: 6px; }',
		'.vpn-checker-page .vpn-log-ok { color: var(--success-color-medium, #2a7d2a); }',
		'.vpn-checker-page .vpn-log-warn { color: var(--warn-color-medium, #b07a2a); }',
		'.vpn-checker-page .vpn-log-err { color: var(--error-color-medium, #b02a2a); font-weight: 600; }',
		'.vpn-checker-page .vpn-log-ts { color: var(--text-color-medium, #888); }',
		'@media (max-width: 539px) {',
		'  .vpn-checker-page .vpn-logs-search { width: 100%; }',
		'  .vpn-checker-page .vpn-logs-actions { width: 100%; }',
		'  .vpn-checker-page .vpn-logs-actions .btn { flex: 1 1 0; }',
		'  .vpn-checker-page .vpn-logs-output { height: 60vh !important; min-height: 20rem; }',
		'}'
	].join('\n');
	document.head.appendChild(st);
}

// ============================================================
// Утилиты
// ============================================================
function isValidUrl(s) {
	try {
		var u = new URL((s || '').trim());
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch (e) { return false; }
}

function setBusy(btn, busy, text) {
	if (!btn) return;
	if (busy) {
		if (btn.classList.contains('vpn-icon-btn')) {
			btn._origHTML = btn.innerHTML;
			btn.innerHTML = '<span class="vpn-spinner"></span>';
		} else {
			btn._origText = btn.textContent;
			btn.textContent = text || '…';
		}
		btn.classList.add('vpn-busy');
		btn.disabled = true;
	} else {
		if (btn.classList.contains('vpn-icon-btn') && btn._origHTML) {
			btn.innerHTML = btn._origHTML;
			btn._origHTML = null;
		} else {
			btn.textContent = btn._origText || btn.textContent;
		}
		btn.classList.remove('vpn-busy');
		btn.disabled = false;
	}
}

function formatMtime(mtime) {
	if (!mtime) return '—';
	var m = String(mtime).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
	if (!m) return mtime;
	return m[4] + ':' + m[5] + ':' + (m[6] || '00');
}

function ageString(mtime) {
	if (!mtime) return '—';
	var m = String(mtime).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
	if (!m) return '—';
	var dt = new Date(
		parseInt(m[1], 10),
		parseInt(m[2], 10) - 1,
		parseInt(m[3], 10),
		parseInt(m[4], 10),
		parseInt(m[5], 10),
		parseInt(m[6] || '0', 10)
	);
	var diff = Math.floor((Date.now() - dt.getTime()) / 1000);
	if (isNaN(diff)) return '—';
	if (diff < 0) diff = 0;
	if (diff < 60) return diff + ' с';
	if (diff < 3600) return Math.floor(diff / 60) + ' мин ' + (diff % 60) + ' с';
	if (diff < 86400) return Math.floor(diff / 3600) + ' ч ' + Math.floor((diff % 3600) / 60) + ' мин';
	return Math.floor(diff / 86400) + ' д ' + Math.floor((diff % 86400) / 3600) + ' ч';
}

function formatUptime(u) {
	if (!u || u <= 0) return '—';
	var d = Math.floor(u / 86400), h = Math.floor((u % 86400) / 3600), m = Math.floor((u % 3600) / 60), s = u % 60;
	var parts = [];
	if (d) parts.push(d + 'д');
	if (h) parts.push(h + 'ч');
	if (m) parts.push(m + 'м');
	if (s || parts.length === 0) parts.push(s + 'с');
	return parts.join(' ');
}

function formatBytes(n) {
	if (!n || n < 1) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(n) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (n / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + units[i];
}

function filterLogText(text, query, group, status) {
	var q = (query || '').trim().toLowerCase();
	var lines = (text || '').split(/\r?\n/);
	return lines.filter(function(line) {
		if (!line) return false;
		if (q && line.toLowerCase().indexOf(q) === -1) return false;
		if (group && group !== '__all__') {
			var re = new RegExp('group\\s+' + group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
			if (!re.test(line)) return false;
		}
		if (status && status !== '__all__') {
			switch (status) {
				case 'ERROR':
					if (line.indexOf('ERROR') === -1 && line.indexOf('FAILED') === -1 && line.indexOf('TIMEOUT') === -1) return false;
					break;
				case 'WARN':
					if (line.indexOf('WARN') === -1 && line.indexOf('NO WORKING') === -1) return false;
					break;
				case 'OK':
					if (!/\bOK\b/.test(line) && line.indexOf('Test run finished') === -1 && line.indexOf('working configurations') === -1) return false;
					break;
				case 'SEP':
					if (line.indexOf('====') === -1) return false;
					break;
			}
		}
		return true;
	}).join('\n');
}

function copyToClipboard(text) {
	var doFallback = function() {
		var ta = document.createElement('textarea');
		ta.value = text;
		document.body.appendChild(ta);
		ta.select();
		try { document.execCommand('copy'); ui.addNotification(null, E('p', {}, 'Скопировано'), 'info'); }
		catch(e) { ui.addNotification(null, E('p', {}, 'Не удалось скопировать'), 'error'); }
		document.body.removeChild(ta);
	};
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard.writeText(text).then(function() {
			ui.addNotification(null, E('p', {}, 'Скопировано'), 'info');
		}, doFallback);
	} else { doFallback(); }
}

function downloadText(content, name, type) {
	var blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
	var link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = name;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}

// ============================================================
// makeDynList: поле ввода с "+" внутри, маркер доступности, подпись
// ============================================================
function makeDynList(values, placeholder, validate) {
	var container = E('div', { 'class': 'vpn-dynlist' });

	function checkAvailability(input, marker, hint) {
		var url = (input.value || '').trim();
		if (!url || !isValidUrl(url)) {
			marker.className = 'vpn-url-marker vpn-url-marker--unknown';
			marker.title = 'Некорректный URL';
			hint.textContent = '';
			hint.className = 'vpn-url-hint';
			return;
		}
		marker.className = 'vpn-url-marker vpn-url-marker--checking';
		marker.title = 'Проверка…';
		hint.textContent = '';
		hint.className = 'vpn-url-hint';
		callCheckUrlAvailable(url).then(function(res) {
			var ok = !!(res && res.ok);
			marker.className = 'vpn-url-marker ' + (ok ? 'vpn-url-marker--ok' : 'vpn-url-marker--err');
			marker.title = ok
				? ('Доступен · ' + (res.code || '') + ' · ' + (res.ms || 0) + ' мс')
				: ('Недоступен' + (res && res.code ? ' · HTTP ' + res.code : '') + (res && res.ms ? ' · ' + res.ms + ' мс' : ''));
			hint.textContent = ok
				? ('HTTP ' + (res.code || '?') + ' · ' + (res.ms || 0) + ' мс')
				: (res && res.code ? 'HTTP ' + res.code : 'нет ответа');
			hint.className = 'vpn-url-hint ' + (ok ? 'vpn-url-hint--ok' : 'vpn-url-hint--err');
		}, function() {
			marker.className = 'vpn-url-marker vpn-url-marker--err';
			marker.title = 'Ошибка проверки';
			hint.textContent = 'ошибка проверки';
			hint.className = 'vpn-url-hint vpn-url-hint--err';
		});
	}

	function addRow(value) {
		var input = E('input', {
			'class': 'cbi-input-text',
			'type': 'text',
			'value': value || '',
			'placeholder': placeholder
		});
		input.addEventListener('input', function() {
			input.classList.toggle('cbi-input-invalid', !!validate && !!input.value.trim() && !validate(input.value));
		});

		var marker = E('span', {
			'class': 'vpn-url-marker vpn-url-marker--unknown',
			'title': 'Доступность не проверена'
		});
		var hint = E('span', { 'class': 'vpn-url-hint' });

		var addBtn = E('div', {
			'class': 'btn cbi-button cbi-button-add',
			'title': 'Добавить строку',
			'click': function() {
				addRow('');
				var rows = container.querySelectorAll('.vpn-dynlist-row');
				var last = rows[rows.length - 1];
				if (last) last.querySelector('input.cbi-input-text').focus();
			}
		}, '+');

		var delBtn = E('button', {
			'class': 'btn cbi-button cbi-button-remove vpn-dynlist-del',
			'type': 'button',
			'title': 'Удалить',
			'click': function() {
				var rows = container.querySelectorAll('.vpn-dynlist-row');
				if (rows.length <= 1) {
					input.value = '';
					marker.className = 'vpn-url-marker vpn-url-marker--unknown';
					hint.textContent = '';
					hint.className = 'vpn-url-hint';
					return;
				}
				row.remove();
			}
		}, '×');

		input.addEventListener('blur', function() { checkAvailability(input, marker, hint); });
		input.addEventListener('keydown', function(ev) {
			if (ev.key === 'Enter') { ev.preventDefault(); checkAvailability(input, marker, hint); }
		});
		if ((value || '').trim()) setTimeout(function() { checkAvailability(input, marker, hint); }, 0);

		var row = E('div', { 'class': 'vpn-dynlist-row' }, [
			E('div', { 'class': 'vpn-dynlist-field' }, [
				E('div', { 'class': 'add-item control-group' }, [input, addBtn])
			]),
			marker,
			delBtn,
			hint
		]);
		container.appendChild(row);
		return row;
	}

	if (values && values.length) values.forEach(function(v){ addRow(v); });
	else addRow('');

	container._getValues = function() {
		var result = [];
		container.querySelectorAll('.vpn-dynlist-row input.cbi-input-text').forEach(function(inp) {
			var v = (inp.value || '').trim();
			if (v) result.push(v);
		});
		return result;
	};

	container._validate = function() {
		if (!validate) return true;
		var ok = true;
		container.querySelectorAll('.vpn-dynlist-row input.cbi-input-text').forEach(function(inp) {
			var v = (inp.value || '').trim();
			if (v && !validate(v)) ok = false;
		});
		return ok;
	};

	return container;
}

// ============================================================
// Вкладка "Группы"
// ============================================================
function renderGroupsTab(data, stats) {
	var groups = (data && data.groups) ? data.groups : {};
	var gs = (stats && stats.groups) ? stats.groups : {};
	var rows = [];

	Object.keys(groups).forEach(function(cfg) {
		var g = groups[cfg];
		var st = gs[cfg] || {};

		var subsTotal = (g.subscriptions || []).length;
		var subsAvail = (typeof st.subs_available === 'number') ? st.subs_available : 0;
		var subsCls = subsAvail > 0 ? 'vpn-count-ok' : 'vpn-count-zero';
		var subsCell = E('span', {}, [
			E('span', { 'class': subsCls }, String(subsAvail)),
			E('span', { 'class': 'vpn-muted' }, ' / ' + subsTotal)
		]);

		var enabledCheck = E('input', {
			'type': 'checkbox',
			'checked': g.enabled ? '' : null,
			'change': function(ev) {
				var checked = ev.target.checked;
				callToggleGroup(cfg, checked ? '1' : '0').then(function(res) {
					if (!res || res.status !== 'ok') {
						ev.target.checked = !checked;
						ui.addNotification(null, E('p', {}, 'Ошибка переключения'), 'error');
					}
				});
			}
		});

		rows.push(E('tr', { 'class': 'tr' }, [
			E('td', { 'class': 'td' }, g.name || cfg),
			E('td', { 'class': 'td' }, subsCell),
			E('td', { 'class': 'td' }, String((g.check_urls || []).length)),
			E('td', { 'class': 'td' }, g.speedtest ? '✓' : '—'),
			E('td', { 'class': 'td' }, enabledCheck),
			E('td', { 'class': 'td' }, g.accuracy || '—'),
			E('td', { 'class': 'td' }, String(g.threads || '—')),
			E('td', { 'class': 'td' }, (g.interval_value || '—') + ' ' + (g.interval_unit || '')),
			E('td', { 'class': 'td vpn-grp-actions' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-edit', 'click': function() { showGroupModal(cfg, g); } }, 'Изменить'),
				' ',
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': function(ev) {
					var btn = ev.currentTarget;
					setBusy(btn, true, 'Запуск…');
					callForceCheck(cfg).then(function(res) {
						setBusy(btn, false);
						if (res && res.status === 'ok') ui.addNotification(null, E('p', {}, 'Проверка запущена: ' + (g.name || cfg)), 'info');
						else ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
					}, function() { setBusy(btn, false); });
				} }, 'Обновить'),
				' ',
				E('button', { 'class': 'btn cbi-button cbi-button-remove', 'click': function(ev) {
					if (!confirm('Удалить группу «' + (g.name || cfg) + '»?')) return;
					var btn = ev.currentTarget;
					setBusy(btn, true, '…');
					callDeleteGroup(cfg).then(function(res) {
						if (res && res.status === 'ok') window.location.reload();
						else { setBusy(btn, false); ui.addNotification(null, E('p', {}, 'Ошибка удаления'), 'error'); }
					}, function() { setBusy(btn, false); });
				} }, 'Удалить')
			])
		]));
	});

	if (rows.length === 0)
		rows.push(E('tr', { 'class': 'tr placeholder' }, [E('td', { 'class': 'td', 'colspan': '9' }, [E('em', {}, 'Группы пока не добавлены.')])]));

	var headers = ['Название','Подписки','URL','Speedtest','Включена','Точность','Потоки','Интервал','Действия'];

	return E('div', { 'class': 'vpn-checker-page' }, [
		E('table', { 'class': 'table vpn-groups-table' }, [
			E('thead', {}, [E('tr', { 'class': 'tr table-titles' }, headers.map(function(t){ return E('th', { 'class': 'th' }, t); }))]),
			E('tbody', {}, rows)
		]),
		E('div', { 'class': 'cbi-page-actions vpn-actions' }, [
			E('button', { 'class': 'btn cbi-button cbi-button-add', 'click': function() {
				showGroupModal(null, { name:'', enabled:true, speedtest:false, threads:10, accuracy:'0.75', interval_value:60, interval_unit:'m', subscriptions:[], check_urls:[] });
			} }, 'Добавить группу'),
			E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': function(ev) {
				var btn = ev.currentTarget;
				setBusy(btn, true, '…');
				callGetGroups().then(function(d) {
					setBusy(btn, false);
					var out = '';
					var groups2 = (d && d.groups) ? d.groups : {};
					Object.keys(groups2).forEach(function(cfg) {
						var g = groups2[cfg];
						out += 'config group \'' + cfg + '\'\n';
						out += '\toption name \'' + (g.name || '') + '\'\n';
						out += '\toption enabled \'' + (g.enabled ? '1' : '0') + '\'\n';
						out += '\toption speedtest \'' + (g.speedtest ? '1' : '0') + '\'\n';
						out += '\toption threads \'' + (g.threads || 10) + '\'\n';
						out += '\toption accuracy \'' + (g.accuracy || '0.75') + '\'\n';
						out += '\toption interval_value \'' + (g.interval_value || 60) + '\'\n';
						out += '\toption interval_unit \'' + (g.interval_unit || 'm') + '\'\n';
						(g.subscriptions || []).forEach(function(u){ out += '\tlist subscriptions \'' + u + '\'\n'; });
						(g.check_urls || []).forEach(function(u){ out += '\tlist check_urls \'' + u + '\'\n'; });
						out += '\n';
					});
					downloadText(out, 'vpn-checker-groups.conf');
				}, function() { setBusy(btn, false); });
			} }, 'Скачать конфиг'),
			E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': function() {
				var input = E('input', { 'type': 'file', 'accept': '.conf,.txt', 'style': 'display:none' });
				input.addEventListener('change', function() {
					var file = input.files[0];
					if (!file) return;
					var reader = new FileReader();
					reader.onload = function() {
						callImportConfig(reader.result).then(function(res) {
							if (res && res.status === 'ok') {
								ui.addNotification(null, E('p', {}, 'Импортировано групп: ' + (res.imported || 0)), 'info');
								setTimeout(function(){ window.location.reload(); }, 800);
							} else {
								ui.addNotification(null, E('p', {}, 'Ошибка импорта: ' + JSON.stringify(res)), 'error');
							}
						});
					};
					reader.readAsText(file);
				});
				document.body.appendChild(input);
				input.click();
				setTimeout(function(){ document.body.removeChild(input); }, 1000);
			} }, 'Загрузить конфиг')
		])
	]);
}

function showGroupModal(cfg, group) {
	var nameInput = E('input', { 'class': 'cbi-input-text', 'value': group.name || '' });
	var enabledCheck = E('input', { 'type': 'checkbox', 'checked': group.enabled ? '' : null });
	var speedCheck = E('input', { 'type': 'checkbox', 'checked': group.speedtest ? '' : null });
	var threadsInput = E('input', { 'class': 'cbi-input-text', 'type': 'number', 'min': '1', 'max': '200', 'value': group.threads || 10 });
	var accuracyInput = E('input', { 'class': 'cbi-input-text', 'type': 'number', 'step': '0.01', 'min': '0', 'max': '1', 'value': group.accuracy || '0.75' });
	var intervalInput = E('input', { 'class': 'cbi-input-text', 'type': 'number', 'min': '1', 'value': group.interval_value || 60 });
	var intervalUnitSelect = E('select', { 'class': 'cbi-input-select' }, [
		E('option', { 'value': 's', 'selected': group.interval_unit === 's' ? '' : null }, 'секунды (s)'),
		E('option', { 'value': 'm', 'selected': group.interval_unit === 'm' ? '' : null }, 'минуты (m)'),
		E('option', { 'value': 'h', 'selected': group.interval_unit === 'h' ? '' : null }, 'часы (h)'),
		E('option', { 'value': 'd', 'selected': group.interval_unit === 'd' ? '' : null }, 'дни (d)')
	]);

	var subsDyn = makeDynList(group.subscriptions || [], 'https://provider.com/sub', isValidUrl);
	var urlsDyn = makeDynList(group.check_urls || [], 'http://cp.cloudflare.com/generate_204', isValidUrl);

	var errBox = E('div', { 'class': 'vpn-field-hint', 'style': 'display:none; text-align:center; margin: 8px 0;' });

	function validateAll() {
		var errors = [];
		if (!nameInput.value.trim()) errors.push('Название не может быть пустым');
		var t = parseInt(threadsInput.value, 10);
		if (isNaN(t) || t < 1 || t > 200) errors.push('Потоков: 1–200');
		var a = parseFloat(accuracyInput.value);
		if (isNaN(a) || a < 0 || a > 1) errors.push('Точность: 0–1');
		var iv = parseInt(intervalInput.value, 10);
		if (isNaN(iv) || iv < 1) errors.push('Интервал: ≥ 1');
		if (!subsDyn._validate()) errors.push('Подписки: все URL должны начинаться с http(s)://');
		if (!urlsDyn._validate()) errors.push('URL проверки: все URL должны начинаться с http(s)://');
		return errors;
	}

	var saveBtn = E('button', { 'class': 'btn cbi-button-positive important', 'click': function() {
		var errors = validateAll();
		if (errors.length) {
			errBox.style.display = 'block';
			errBox.innerHTML = errors.map(function(e){ return '• ' + e; }).join('<br>');
			return;
		}
		errBox.style.display = 'none';
		var payload = {
			cfg: cfg || '',
			name: nameInput.value.trim(),
			enabled: enabledCheck.checked ? '1' : '0',
			speedtest: speedCheck.checked ? '1' : '0',
			threads: String(parseInt(threadsInput.value, 10)),
			accuracy: String(parseFloat(accuracyInput.value)),
			interval_value: String(parseInt(intervalInput.value, 10)),
			interval_unit: intervalUnitSelect.value || 'm',
			subscriptions: subsDyn._getValues(),
			check_urls: urlsDyn._getValues()
		};
		setBusy(saveBtn, true, 'Сохранение…');
		callSaveGroup(JSON.stringify(payload)).then(function(res) {
			if (res && res.status === 'ok') { ui.hideModal(); window.location.reload(); }
			else { setBusy(saveBtn, false); ui.addNotification(null, E('p', {}, 'Ошибка сохранения: ' + JSON.stringify(res)), 'error'); }
		}, function() { setBusy(saveBtn, false); ui.addNotification(null, E('p', {}, 'Ошибка RPC'), 'error'); });
	} }, 'Сохранить');

	ui.showModal(cfg ? 'Изменить группу' : 'Добавить группу', [
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Название'), E('div', { 'class': 'cbi-value-field' }, nameInput)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Подписки'), E('div', { 'class': 'cbi-value-field' }, subsDyn)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'URL проверки'), E('div', { 'class': 'cbi-value-field' }, urlsDyn)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Точность'), E('div', { 'class': 'cbi-value-field' }, accuracyInput)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Потоков'), E('div', { 'class': 'cbi-value-field' }, threadsInput)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Интервал'), E('div', { 'class': 'cbi-value-field' }, [
			E('div', { 'class': 'vpn-interval-row' }, [intervalInput, intervalUnitSelect])
		])]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Speedtest'), E('div', { 'class': 'cbi-value-field' }, speedCheck)]),
		E('div', { 'class': 'cbi-value' }, [E('label', { 'class': 'cbi-value-title' }, 'Включена'), E('div', { 'class': 'cbi-value-field' }, enabledCheck)]),
		errBox,
		E('div', { 'class': 'right' }, [
			E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Отмена'), ' ',
			saveBtn
		])
	]);
}

// ============================================================
// Дашборд
// ============================================================
function renderDashboardTab(bin, cpu, svc, stats, compat) {
	var banners = [];
	if (svc && svc.status === 'running' && svc.uptime > 0 && svc.uptime < 60) {
		banners.push(E('div', { 'class': 'vpn-banner vpn-banner-warn' }, '⚡ runner.sh недавно перезапускался (uptime ' + formatUptime(svc.uptime) + '). Проверь лог.'));
	}
	if (svc && svc.restarts_recent && svc.restarts_recent > 3) {
		banners.push(E('div', { 'class': 'vpn-banner vpn-banner-err' }, '⛔ Много рестартов службы (' + svc.restarts_recent + '). Смотри лог.'));
	}
	if (compat && compat.installed && compat.outdated) {
		banners.push(E('div', { 'class': 'vpn-banner vpn-banner-warn' }, '⚠ xray-knife ' + (compat.local_version || '?') + ' старее рекомендуемой ' + (bin.min_version || '') + '. Протоколы hysteria2/tuic/anytls могут не работать.'));
	}

	var running = svc && svc.status === 'running';
	var statusClass = running ? 'vpn-status-ok' : 'vpn-status-err';
	var statusText = running ? '● running' : '● stopped';

	var latestBadge;
	if (!bin.installed) {
		latestBadge = E('span', { 'class': 'vpn-badge vpn-badge-err' }, 'не установлен');
	} else if (bin.latest_version && bin.latest_version !== 'unknown' && bin.version && bin.version.indexOf(bin.latest_version.replace(/^v/, '')) === -1) {
		latestBadge = E('span', { 'class': 'vpn-badge vpn-badge-warn' }, '→ ' + bin.latest_version);
	} else if (bin.latest_version) {
		latestBadge = E('span', { 'class': 'vpn-badge vpn-badge-ok' }, 'актуален');
	} else {
		latestBadge = E('span', { 'class': 'vpn-badge' }, 'не проверялось');
	}

	function kv(k, v) {
		return E('div', { 'class': 'vpn-row' }, [
			E('span', { 'class': 'vpn-k' }, k),
			E('span', { 'class': 'vpn-v' }, v)
		]);
	}

	function svgIcon(paths) {
		var NS = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(NS, 'svg');
		svg.setAttribute('xmlns', NS);
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'currentColor');
		svg.setAttribute('stroke-width', '2');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		svg.setAttribute('aria-hidden', 'true');
		paths.forEach(function(p) {
			if (p.circle) {
				var c = document.createElementNS(NS, 'circle');
				c.setAttribute('cx', p.circle[0]); c.setAttribute('cy', p.circle[1]); c.setAttribute('r', p.circle[2]);
				svg.appendChild(c);
			} else if (p.rect) {
				var r = document.createElementNS(NS, 'rect');
				r.setAttribute('x', p.rect[0]); r.setAttribute('y', p.rect[1]);
				r.setAttribute('width', p.rect[2]); r.setAttribute('height', p.rect[3]);
				if (p.rect[4]) r.setAttribute('rx', p.rect[4]);
				svg.appendChild(r);
			} else if (p.line) {
				var l = document.createElementNS(NS, 'line');
				l.setAttribute('x1', p.line[0]); l.setAttribute('y1', p.line[1]);
				l.setAttribute('x2', p.line[2]); l.setAttribute('y2', p.line[3]);
				svg.appendChild(l);
			} else if (p.d) {
				var path = document.createElementNS(NS, 'path');
				path.setAttribute('d', p.d);
				svg.appendChild(path);
			}
		});
		return svg;
	}

	var ICON_PLAY = [ { d: 'M6 4v16l14-8z' } ];
	var ICON_STOP = [ { rect: [5, 5, 14, 14, 2] } ];
	var ICON_RESTART = [
		{ d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' },
		{ d: 'M3 3v5h5' }
	];
	var ICON_CHECK = [ { d: 'M21 12a9 9 0 1 1-6.219-8.56' } ];
	var ICON_DOWNLOAD = [
		{ d: 'M12 15V3' },
		{ d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
		{ d: 'm7 10 5 5 5-5' }
	];
	var ICON_TRASH = [
		{ d: 'M3 6h18' },
		{ d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' },
		{ d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }
	];

	function iconBtn(iconPaths, label, onClick, cls) {
		return E('button', {
			'class': 'btn vpn-icon-btn ' + (cls || ''),
			'type': 'button',
			'title': label,
			'aria-label': label,
			'click': onClick
		}, [ svgIcon(iconPaths), E('span', { 'class': 'vpn-icon-label' }, label) ]);
	}

	function svcAction(action, icon, label, cls) {
		return iconBtn(icon, label, function(ev) {
			var btn = ev.currentTarget;
			setBusy(btn, true, '…');
			callServiceAction(action).then(function(res) {
				setBusy(btn, false);
				if (res && res.status === 'ok') setTimeout(function(){ window.location.reload(); }, 500);
				else ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
			}, function() { setBusy(btn, false); });
		}, cls);
	}

	var svcActions = E('div', { 'class': 'vpn-cell-actions' }, [
		svcAction('start', ICON_PLAY, 'Start', 'vpn-icon-btn-pos'),
		svcAction('stop', ICON_STOP, 'Stop', 'vpn-icon-btn-neg'),
		svcAction('restart', ICON_RESTART, 'Restart', 'vpn-icon-btn-warn')
	]);

	var checkBtn = iconBtn(ICON_CHECK, 'Проверить', function(ev) {
		var btn = ev.currentTarget;
		setBusy(btn, true, '…');
		callCheckBinaryUpdate().then(function(res) {
			setBusy(btn, false);
			if (res && res.status === 'ok') {
				ui.addNotification(null, E('p', {}, 'Последняя версия: ' + (res.tag_name || '?')), 'info');
				setTimeout(function(){ window.location.reload(); }, 500);
			} else {
				ui.addNotification(null, E('p', {}, 'GitHub недоступен: ' + (res.error || '?')), 'error');
			}
		}, function() { setBusy(btn, false); });
	});

	var downloadBtn = iconBtn(ICON_DOWNLOAD, 'Обновить', function(ev) {
		var btn = ev.currentTarget;
		setBusy(btn, true, '…');
		ui.showModal('Скачивание', [E('p', {}, 'Загрузка бинарника xray-knife, 10–30 секунд...')]);
		callDownload().then(function(res) {
			ui.hideModal();
			setBusy(btn, false);
			if (res && res.status === 'ok') {
				window.location.reload();
			} else if (res && res.error === 'knife_running') {
				ui.addNotification(null, E('p', {}, 'Нельзя обновить: идёт проверка (xray-knife запущен). Дождитесь окончания.'), 'warning');
			} else {
				ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
			}
		}, function() { ui.hideModal(); setBusy(btn, false); });
	});

	var removeBtn = iconBtn(ICON_TRASH, 'Удалить', function(ev) {
		if (!confirm('Удалить бинарник xray-knife? Проверки перестанут работать до повторного скачивания.')) return;
		var btn = ev.currentTarget;
		setBusy(btn, true, '…');
		callRemoveBinary().then(function(res) {
			setBusy(btn, false);
			if (res && res.status === 'ok') window.location.reload();
			else ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
		}, function() { setBusy(btn, false); });
	});

	var binActions = E('div', { 'class': 'vpn-cell-actions' }, [checkBtn, downloadBtn, removeBtn]);

	function systemRamText() {
		var ram = cpu.memory || {};
		var total = ram.total || 0;
		var used = ram.used || 0;
		if (!total) return '—';
		return Math.round(used * 100 / total) + '% · ' + formatBytes(used) + ' / ' + formatBytes(total);
	}

	function storageText() {
		var s = cpu.storage || {};
		var total = s.total || 0;
		var used = s.used || 0;
		if (!total) return '—';
		return Math.round(used * 100 / total) + '% · ' + formatBytes(used) + ' / ' + formatBytes(total);
	}

	function tempText(t) {
		if (t === null || t === undefined || t === '' || isNaN(t) || Number(t) === 0) return '—';
		return Number(t).toFixed(1) + ' °C';
	}

	function avgText(c) {
		var p = c && c.loadavg_percent;
		if (p === undefined || p === null || isNaN(p)) {
			var l = parseFloat(c && c.loadavg);
			var n = parseInt(c && c.cpu_cores, 10);
			if (!isNaN(l) && n > 0) p = l * 100 / n;
		}
		if (p === undefined || p === null || isNaN(p)) return '—';
		return Math.round(p) + '%';
	}

	function procRamText() {
		var ram = cpu.process_memory || {};
		var rss = ram.rss || 0;
		if (!rss) return '—';
		return formatBytes(rss);
	}

	function procStorageText() {
		var ps = cpu.process_storage || {};
		var used = ps.used || 0;
		var total = (cpu.storage || {}).total || 0;
		if (!used) return '—';
		if (total) return Math.round(used * 100 / total) + '% · ' + formatBytes(used) + ' / ' + formatBytes(total);
		return formatBytes(used);
	}

	var dashTable = E('table', { 'class': 'vpn-dash-table' }, [
		E('thead', {}, [
			E('tr', {}, [
				E('th', {}, 'Служба'),
				E('th', {}, 'xray-knife'),
				E('th', {}, 'CPU / ОЗУ (общий)'),
				E('th', {}, 'CPU / ОЗУ (скрипт)')
			])
		]),
		E('tbody', {}, [
			E('tr', {}, [
				E('td', {}, [
					E('div', { 'class': 'vpn-row' }, [
						E('span', { 'class': statusClass, 'id': 'svc-status' }, statusText)
					]),
					kv('PID', E('span', { 'id': 'svc-pid' }, (svc && svc.pid) ? svc.pid : '—')),
					kv('Uptime', E('span', { 'id': 'svc-uptime' }, formatUptime(svc && svc.uptime))),
					kv('Рестартов', E('span', { 'id': 'svc-restarts' }, String(svc.restarts_recent || 0))),
					svcActions
				]),
				E('td', {}, [
					E('div', { 'class': 'vpn-row' }, [
						bin.installed ? '✅' : '❌',
						' ',
						latestBadge
					]),
					kv('Версия', E('span', { 'id': 'bin-version' }, bin.version || '—')),
					kv('Последняя', E('span', { 'id': 'bin-latest' }, bin.latest_version || '—')),
					kv('Арх.', bin.arch || '—'),
					binActions
				]),
				E('td', {}, [
					kv('CPU', E('span', { 'id': 'cpu-system' }, (cpu.system_load || 0) + '% · avg ' + avgText(cpu))),
					kv('ОЗУ', E('span', { 'id': 'cpu-memory' }, systemRamText())),
					kv('MEM', E('span', { 'id': 'cpu-storage' }, storageText())),
					kv('Темп.', E('span', { 'id': 'cpu-temp' }, tempText(cpu.temperature)))
				]),
				E('td', {}, [
					kv('CPU', E('span', { 'id': 'cpu-process' }, (cpu.process_load || 0) + '%')),
					kv('ОЗУ', E('span', { 'id': 'cpu-process-memory' }, procRamText())),
					kv('MEM', E('span', { 'id': 'cpu-process-storage' }, procStorageText())),
					kv('Статус', running ? 'работает' : '—')
				])
			])
		])
	]);

	function forceCheckBtn(cfg, name) {
		return E('button', {
			'class': 'btn cbi-button cbi-button-action',
			'type': 'button',
			'click': function(ev) {
				var btn = ev.currentTarget;
				setBusy(btn, true, '…');
				callForceCheck(cfg).then(function(res) {
					setBusy(btn, false);
					if (res && res.status === 'ok') {
						ui.addNotification(null, E('p', {}, 'Проверка запущена: ' + (name || cfg)), 'info');
					} else {
						ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
					}
				}, function() { setBusy(btn, false); });
			}
		}, 'Запустить');
	}

	function buildStatsRows(st) {
		var gs = (st && st.groups) ? st.groups : {};
		var rows = Object.keys(gs).map(function(cfg) {
			var g = gs[cfg];
			var linkCell;
			if (g.url) {
				linkCell = E('a', { 'href': g.url, 'target': '_blank', 'title': g.url }, g.url);
			} else {
				linkCell = E('em', { 'class': 'vpn-muted' }, '—');
			}
			var copyCell;
			if (g.url) {
				copyCell = E('button', {
					'class': 'btn cbi-button cbi-button-neutral vpn-copy-btn',
					'type': 'button',
					'click': function(ev) { ev.preventDefault(); copyToClipboard(g.url); }
				}, 'Копировать');
			} else {
				copyCell = E('em', { 'class': 'vpn-muted' }, '—');
			}
			var avail = parseInt(g.available || 0, 10);
			var total = parseInt(g.total || 0, 10);
			var availCls = avail > 0 ? 'vpn-count-ok' : 'vpn-count-zero';
			var runningCell = g.running
				? E('span', { 'class': 'vpn-status-warn' }, [E('span', { 'class': 'vpn-spinner' }), 'идёт'])
				: E('span', { 'class': 'vpn-muted' }, '—');
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, g.name || cfg),
				E('td', { 'class': 'td' }, [E('span', { 'class': availCls }, String(avail)), total ? E('span', { 'class': 'vpn-muted' }, ' / ' + total) : '']),
				E('td', { 'class': 'td' }, runningCell),
				E('td', { 'class': 'td' }, formatMtime(g.mtime)),
				E('td', { 'class': 'td' }, ageString(g.mtime)),
				E('td', { 'class': 'td' }, copyCell),
				E('td', { 'class': 'td' }, linkCell),
				E('td', { 'class': 'td' }, forceCheckBtn(cfg, g.name))
			]);
		});
		if (rows.length === 0)
			rows.push(E('tr', { 'class': 'tr placeholder' }, [E('td', { 'class': 'td', 'colspan': '8' }, [E('em', {}, 'Нет данных.')])]));
		return rows;
	}

	var checkAllBtn = E('button', { 'class': 'btn cbi-button-positive', 'click': function(ev) {
		var btn = ev.currentTarget;
		if (!confirm('Запустить проверку всех включённых групп?')) return;
		setBusy(btn, true, 'Запуск…');
		callForceCheckAll().then(function(res) {
			setBusy(btn, false);
			if (res && res.status === 'ok') {
				ui.addNotification(null, E('p', {}, 'Запущено проверок: ' + (res.triggered || 0)), 'info');
			} else {
				ui.addNotification(null, E('p', {}, 'Ошибка: ' + JSON.stringify(res)), 'error');
			}
		}, function() { setBusy(btn, false); });
	} }, 'Проверить все группы');

	var statsHead = E('tr', { 'class': 'tr table-titles' }, [
		E('th', { 'class': 'th' }, 'Группа'),
		E('th', { 'class': 'th' }, 'Рабочих'),
		E('th', { 'class': 'th' }, 'Прогон'),
		E('th', { 'class': 'th' }, 'Обновлено'),
		E('th', { 'class': 'th' }, 'Возраст'),
		E('th', { 'class': 'th', 'colspan': '2', 'style': 'text-align:center' }, 'Ссылка'),
		E('th', { 'class': 'th' }, 'Проверка')
	]);

	var statsSection = E('div', { 'class': 'vpn-stats' }, [
		E('div', { 'class': 'vpn-stats-head' }, [
			E('h3', {}, 'Статистика'),
			checkAllBtn
		]),
		E('table', { 'class': 'table' }, [
			E('thead', {}, [ statsHead ]),
			E('tbody', { 'id': 'vpn-stats-tbody' }, buildStatsRows(stats))
		])
	]);

	setTimeout(function() {
		poll.add(function() {
			return Promise.all([callServiceStatus(), callCpuLoad(), callStats()]).then(function(r) {
				var s = r[0] || {};
				var c = r[1] || {};
				var st = r[2] || {};
				var isRunning = s.status === 'running';
				var el = document.getElementById('svc-status');
				if (el) {
					el.textContent = isRunning ? '● running' : '● stopped';
					el.className = isRunning ? 'vpn-status-ok' : 'vpn-status-err';
				}
				var pidEl = document.getElementById('svc-pid');
				if (pidEl) pidEl.textContent = s.pid || '—';
				var upEl = document.getElementById('svc-uptime');
				if (upEl) upEl.textContent = formatUptime(s.uptime);
				var rEl = document.getElementById('svc-restarts');
				if (rEl) rEl.textContent = String(s.restarts_recent || 0);
				var cpuSysEl = document.getElementById('cpu-system');
				if (cpuSysEl) cpuSysEl.textContent = (c.system_load || 0) + '% · avg ' + avgText(c);
				var ramEl = document.getElementById('cpu-memory');
				if (ramEl) {
					var ram = c.memory || {};
					var total = ram.total || 0;
					var used = ram.used || 0;
					ramEl.textContent = total
						? Math.round(used * 100 / total) + '% · ' + formatBytes(used) + ' / ' + formatBytes(total)
						: '—';
				}
				var stEl = document.getElementById('cpu-storage');
				if (stEl) {
					var sdata = c.storage || {};
					var stotal = sdata.total || 0;
					var sused = sdata.used || 0;
					stEl.textContent = stotal
						? Math.round(sused * 100 / stotal) + '% · ' + formatBytes(sused) + ' / ' + formatBytes(stotal)
						: '—';
				}
				var tempEl = document.getElementById('cpu-temp');
				if (tempEl) tempEl.textContent = tempText(c.temperature);
				var cpuProc = document.getElementById('cpu-process');
				if (cpuProc) cpuProc.textContent = (c.process_load || 0) + '%';
				var procRamEl = document.getElementById('cpu-process-memory');
				if (procRamEl) {
					var pram = c.process_memory || {};
					procRamEl.textContent = pram.rss ? formatBytes(pram.rss) : '—';
				}
				var procStEl = document.getElementById('cpu-process-storage');
				if (procStEl) {
					var ps = c.process_storage || {};
					var pused = ps.used || 0;
					var ptotal = (c.storage || {}).total || 0;
					procStEl.textContent = pused
						? (ptotal ? Math.round(pused * 100 / ptotal) + '% · ' + formatBytes(pused) + ' / ' + formatBytes(ptotal) : formatBytes(pused))
						: '—';
				}
				var tbody = document.getElementById('vpn-stats-tbody');
				if (tbody) {
					var newRows = buildStatsRows(st);
					tbody.replaceChildren.apply(tbody, newRows);
				}
			});
		}, 5);
	}, 0);

	return E('div', { 'class': 'vpn-checker-page vpn-dash' }, [
		E('div', { 'class': 'vpn-banners' }, banners),
		dashTable,
		statsSection
	]);
}

// ============================================================
// Вкладка "Лог"
// ============================================================
function renderLogTab(data, groupsData) {
	var rawContent = (data && data.content) || '';
	var logsLoaded = false;
	var loading = false;
	var searchQuery = '';
	var filterGroup = '__all__';
	var filterStatus = '__all__';
	var autoRefresh = true;
	var linesLimit = 500;
	var whichFile = 'current';
	var hasPrev = !!(data && data.has_prev);
	var searchTimer = null;

	var groupNames = ['__all__'];
	try {
		var gg = (groupsData && groupsData.groups) ? groupsData.groups : {};
		Object.keys(gg).forEach(function(cfg) {
			groupNames.push(cfg);
		});
	} catch (e) {}

	var searchInput = E('input', {
		'class': 'cbi-input-text vpn-logs-search-input',
		'type': 'search',
		'placeholder': 'Поиск',
		'autocomplete': 'off'
	});
	var searchIconWrap = E('span', { 'class': 'vpn-logs-search-icon' });

	var groupSelect = E('select', { 'class': 'cbi-input-select', 'style': 'width: auto; margin: 0;' },
		groupNames.map(function(g) {
			return E('option', { 'value': g, 'selected': g === '__all__' ? '' : null }, g === '__all__' ? 'Все группы' : g);
		})
	);
	groupSelect.addEventListener('change', function() {
		filterGroup = groupSelect.value;
		renderLogs(false);
	});

	var statusSelect = E('select', { 'class': 'cbi-input-select', 'style': 'width: auto; margin: 0;' }, [
		E('option', { 'value': '__all__', 'selected': '' }, 'Все уровни'),
		E('option', { 'value': 'ERROR' }, 'ERROR / FAILED / TIMEOUT'),
		E('option', { 'value': 'WARN' }, 'WARN / NO WORKING'),
		E('option', { 'value': 'OK' }, 'OK / finished'),
		E('option', { 'value': 'SEP' }, 'Только разделители')
	]);
	statusSelect.addEventListener('change', function() {
		filterStatus = statusSelect.value;
		renderLogs(false);
	});

	var fileSelect = E('select', { 'class': 'cbi-input-select', 'style': 'width: auto; margin: 0;' + (hasPrev ? '' : ' display:none;') }, [
		E('option', { 'value': 'current', 'selected': '' }, 'Текущий лог'),
		E('option', { 'value': 'prev' }, 'Предыдущий (.log.1)')
	]);
	fileSelect.addEventListener('change', function() {
		whichFile = fileSelect.value;
		logsLoaded = false;
		refreshLogs();
	});

	var autoCheckbox = E('input', {
		'type': 'checkbox',
		'checked': '',
		'change': function() { autoRefresh = autoCheckbox.checked; }
	});
	var linesSelect = E('select', { 'class': 'cbi-input-select', 'style': 'width: auto; margin: 0;' }, [
		E('option', { 'value': '500', 'selected': '' }, '500 строк'),
		E('option', { 'value': '1000' }, '1000 строк'),
		E('option', { 'value': '2000' }, '2000 строк'),
		E('option', { 'value': '5000' }, '5000 строк')
	]);
	linesSelect.addEventListener('change', function() {
		linesLimit = parseInt(linesSelect.value, 10) || 500;
		logsLoaded = false;
		refreshLogs();
	});
	var copyBtn = E('button', { 'class': 'btn cbi-button', 'type': 'button', 'disabled': true }, 'Копировать');
	var downloadBtn = E('button', { 'class': 'btn cbi-button', 'type': 'button', 'disabled': true }, 'Скачать');
	var clearBtn = E('button', { 'class': 'btn cbi-button cbi-button-negative', 'type': 'button' }, 'Очистить');
	var output = E('pre', {
		'class': 'vpn-logs-output vpn-logs-output--empty',
		'tabIndex': 0,
		'role': 'log',
		'aria-label': 'Лог VPN-Checker',
		'aria-busy': 'true'
	}, 'Загрузка логов...');

	var searchSvg = (function() {
		var NS = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(NS, 'svg');
		svg.setAttribute('xmlns', NS);
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'currentColor');
		svg.setAttribute('stroke-width', '2');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		var p1 = document.createElementNS(NS, 'path');
		p1.setAttribute('d', 'm21 21-4.34-4.34');
		var c1 = document.createElementNS(NS, 'circle');
		c1.setAttribute('cx', '11'); c1.setAttribute('cy', '11'); c1.setAttribute('r', '8');
		svg.appendChild(p1); svg.appendChild(c1);
		return svg;
	})();
	searchIconWrap.appendChild(searchSvg);

	function getVisibleLogs() {
		return filterLogText(rawContent, searchQuery, filterGroup, filterStatus);
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, function(c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function lineToHtml(line) {
		var cls = 'vpn-log-line';
		var html = escapeHtml(line);
		if (line.indexOf('====') !== -1) {
			cls += ' vpn-log-sep';
		} else if (line.indexOf('ERROR') !== -1 || line.indexOf('FAILED') !== -1 || line.indexOf('TIMEOUT') !== -1) {
			cls += ' vpn-log-err';
		} else if (line.indexOf('WARN') !== -1 || line.indexOf('NO WORKING') !== -1) {
			cls += ' vpn-log-warn';
		} else if (/\bOK\b/.test(line) || line.indexOf('Test run finished') !== -1 || line.indexOf('working configurations') !== -1) {
			cls += ' vpn-log-ok';
		}
		var tsMatch = line.match(/^(\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\])/);
		if (tsMatch) {
			var rest = html.substring(tsMatch[0].length);
			html = '<span class="vpn-log-ts">' + escapeHtml(tsMatch[1]) + '</span>' + rest;
		}
		return '<span class="' + cls + '">' + html + '</span>';
	}

	function renderLogs(scrollToTop) {
		var visible = getVisibleLogs();
		var searching = searchQuery.trim() !== '' || filterGroup !== '__all__' || filterStatus !== '__all__';
		if (!visible) {
			output.textContent = rawContent ? 'Нет строк, удовлетворяющих фильтру' : 'Логи пусты';
			output.classList.add('vpn-logs-output--empty');
		} else {
			output.innerHTML = visible.split(/\r?\n/).filter(function(l){ return l.length; }).map(lineToHtml).join('');
			output.classList.remove('vpn-logs-output--empty');
		}
		copyBtn.textContent = searching ? 'Копировать совпадающие' : 'Копировать';
		copyBtn.disabled = !visible;
		downloadBtn.textContent = searching ? 'Скачать совпадающие' : 'Скачать';
		downloadBtn.disabled = !visible;
		if (scrollToTop) { output.scrollTop = 0; output.scrollLeft = 0; }
	}

	function setLoading(next) {
		loading = next;
		output.setAttribute('aria-busy', String(next));
	}

	async function refreshLogs() {
		if (loading) return;
		var distanceFromEnd = output.scrollHeight - output.scrollTop - output.clientHeight;
		var followEnd = !logsLoaded || distanceFromEnd < 32;
		var prevScrollTop = output.scrollTop;
		var prevScrollLeft = output.scrollLeft;
		setLoading(true);
		try {
			var response = await callLog(String(linesLimit), whichFile);
			var nextLogs = String((response && response.content) || '');
			hasPrev = !!(response && response.has_prev);
			fileSelect.style.display = hasPrev ? '' : 'none';
			if (logsLoaded && nextLogs === rawContent) { setLoading(false); return; }
			logsLoaded = true;
			rawContent = nextLogs;
			renderLogs();
			requestAnimationFrame(function() {
				output.scrollTop = followEnd ? output.scrollHeight : prevScrollTop;
				output.scrollLeft = prevScrollLeft;
			});
		} catch (e) {
			console.error('[LOGS] Failed to load logs', e);
			if (!logsLoaded) output.textContent = 'Не удалось загрузить логи';
		} finally { setLoading(false); }
	}

	searchInput.addEventListener('input', function() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(function() {
			searchQuery = searchInput.value;
			renderLogs(true);
		}, 150);
	});

	copyBtn.addEventListener('click', function() {
		var visible = getVisibleLogs();
		if (visible) copyToClipboard(visible);
	});

	downloadBtn.addEventListener('click', function() {
		var visible = getVisibleLogs();
		if (!visible) return;
		var ts = new Date().toISOString().replace(/[:.]/g, '-');
		downloadText(visible, 'vpn-checker-log-' + ts + '.txt');
	});

	clearBtn.addEventListener('click', function(ev) {
		if (!confirm('Очистить текущий лог?')) return;
		var btn = ev.currentTarget;
		setBusy(btn, true, '…');
		callClearLog().then(function() {
			rawContent = '';
			renderLogs();
			setBusy(btn, false);
		}, function() { setBusy(btn, false); });
	});

	setTimeout(function() { void refreshLogs(); }, 0);
	poll.add(function() {
		if (!autoRefresh) return Promise.resolve();
		if (whichFile !== 'current') return Promise.resolve();
		return refreshLogs();
	}, 2);

	return E('div', { 'class': 'vpn-checker-page' }, [
		E('div', { 'class': 'vpn-logs-pane' }, [
			E('div', { 'class': 'vpn-logs-toolbar' }, [
				E('div', { 'class': 'vpn-logs-controls' }, [
					E('label', { 'class': 'vpn-logs-search' }, [searchIconWrap, searchInput]),
					groupSelect,
					statusSelect,
					fileSelect,
					E('label', { 'class': 'vpn-logs-checkbox' }, [autoCheckbox, E('span', {}, 'Автообновление')]),
					linesSelect
				]),
				E('div', { 'class': 'vpn-logs-actions' }, [copyBtn, downloadBtn, clearBtn])
			]),
			output
		])
	]);
}

// ============================================================
// Главный view
// ============================================================
return view.extend({
	load: function() {
		return Promise.all([
			callGetGroups(),
			Promise.all([callBinaryStatus(), callCpuLoad(), callServiceStatus(), callStats(), callCompat()]),
			callLog('500', 'current')
		]);
	},

	render: function(results) {
		var m = new form.Map('vpn-checker', 'VPN-Checker');
		m.tabbed = true;

		// 1) Дашборд
		var s2 = m.section(form.TypedSection, 'dashboard_tab', 'Дашборд');
		s2.anonymous = true; s2.addremove = false;
		s2.cfgsections = function() { return ['dashboard_tab']; };
		var o2 = s2.option(form.DummyValue, '_dashboard');
		o2.rawhtml = true;
		o2.cfgvalue = function() {
			return renderDashboardTab(results[1][0], results[1][1], results[1][2], results[1][3], results[1][4]);
		};

		// 2) Группы
		var s1 = m.section(form.TypedSection, 'groups_tab', 'Группы');
		s1.anonymous = true; s1.addremove = false;
		s1.cfgsections = function() { return ['groups_tab']; };
		var o1 = s1.option(form.DummyValue, '_groups');
		o1.rawhtml = true;
		o1.cfgvalue = function() {
			return renderGroupsTab(results[0], results[1][3]);
		};

		// 3) Лог
		var s3 = m.section(form.TypedSection, 'log_tab', 'Лог');
		s3.anonymous = true; s3.addremove = false;
		s3.cfgsections = function() { return ['log_tab']; };
		var o3 = s3.option(form.DummyValue, '_log');
		o3.rawhtml = true;
		o3.cfgvalue = function() { return renderLogTab(results[2], results[0]); };

		return m.render();
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});