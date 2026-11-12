#!/bin/sh

LOG=/tmp/vpn-checker/vpn-checker.log
LOCK=/var/run/vpn-checker.lock
STATE_DIR=/tmp/vpn-checker
WWW_DIR=/www/vpn-checker
BIN=/usr/share/vpn-checker/xray-knife
KNIFE_TIMEOUT=600
KNIFE_MIN_VERSION="1.6.0"
HEARTBEAT_SEC=30

. /lib/functions.sh

mkdir -p "$STATE_DIR" "$WWW_DIR"
chmod 755 "$WWW_DIR"

log() {
	echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

CHILD_PID=""
cleanup() {
	if [ -n "$CHILD_PID" ] && kill -0 "$CHILD_PID" 2>/dev/null; then
		kill -TERM "$CHILD_PID" 2>/dev/null
		sleep 2
		kill -KILL "$CHILD_PID" 2>/dev/null
	fi
	# снять маркеры «идёт прогон», иначе после рестарта индикатор зависнет
	rm -f "$STATE_DIR"/running_* 2>/dev/null
	rm -f "$LOCK"
	exit 0
}
trap cleanup TERM INT

if [ -f "$LOCK" ]; then
	pid=$(cat "$LOCK" 2>/dev/null)
	if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
		log "another runner.sh already running (PID $pid), sleeping 60"
		sleep 60
		exit 0
	fi
	log "stale lock (PID $pid), overriding"
	rm -f "$LOCK"
fi
echo $$ > "$LOCK"
# после рестарта могли остаться зависшие маркеры
rm -f "$STATE_DIR"/running_* 2>/dev/null

rotate_log() {
	[ -f "$LOG" ] || return
	local size
	size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
	if [ "$size" -gt 524288 ]; then
		mv -f "$LOG" "$LOG.1" 2>/dev/null
		log "log rotated (>512KB), previous saved as vpn-checker.log.1"
	fi
}

interval_to_seconds() {
	local val="$1" unit="$2"
	case "$unit" in
		s) echo "$val" ;;
		m) echo $(( val * 60 )) ;;
		h) echo $(( val * 3600 )) ;;
		d) echo $(( val * 86400 )) ;;
		*) echo 3600 ;;
	esac
}

# Прелюдия xray-knife, которую не пишем в общий лог
KNIFE_NOISE_RE='^(Total configs:|Thread count:|Maximum delay:|Speed test:|IP info:|Insecure TLS:|Test panel:|Pass threshold:|Output file:|ℹ️   [0-9]+:[0-9]+ Semantic dedup)'

check_knife_compat() {
	local cfg="$1"
	local configs="$2"
	[ -x "$BIN" ] || return 0
	[ -f "$configs" ] || return 0

	local ver_raw ver
	ver_raw=$("$BIN" --version 2>/dev/null | head -n1)
	[ -z "$ver_raw" ] && ver_raw=$("$BIN" -v 2>/dev/null | head -n1)
	ver=$(echo "$ver_raw" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
	[ -z "$ver" ] && return 0

	local has_modern=0
	if grep -qE '^(hysteria2|tuic|anytls)://' "$configs" 2>/dev/null; then
		has_modern=1
	fi

	if [ "$has_modern" = "1" ]; then
		local v_major=${ver%%.*}
		local v_rest=${ver#*.}
		local v_minor=${v_rest%%.*}
		local n_major=${KNIFE_MIN_VERSION%%.*}
		local n_rest=${KNIFE_MIN_VERSION#*.}
		local n_minor=${n_rest%%.*}
		if [ "$v_major" -lt "$n_major" ] 2>/dev/null || \
		   { [ "$v_major" -eq "$n_major" ] 2>/dev/null && [ "$v_minor" -lt "$n_minor" ] 2>/dev/null; }; then
			log "WARN group $cfg: xray-knife $ver < $KNIFE_MIN_VERSION, протоколы hysteria2/tuic/anytls могут не работать"
		fi
	fi
}

fetch_subscription() {
	local url="$1"
	local out="$2"

	local body
	body=$(wget -q -O - \
		--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" \
		--max-redirect=5 \
		--timeout=30 \
		--tries=2 \
		"$url" 2>/dev/null)
	[ -z "$body" ] && return 1

	if echo "$body" | grep -q '://'; then
		echo "$body" >> "$out"
	else
		echo "$body" | tr '_-' '/+' | base64 -d >> "$out" 2>/dev/null || echo "$body" >> "$out"
	fi
	return 0
}

SUB_ITEMS=""
URL_ITEMS=""
collect_sub() { SUB_ITEMS="${SUB_ITEMS}${1}
"; }
collect_url() { URL_ITEMS="${URL_ITEMS}${1}
"; }

run_check() {
	local cfg="$1"

	local enabled
	config_load vpn-checker
	config_get_bool enabled "$cfg" enabled 0
	[ "$enabled" = "1" ] || return

	local name speedtest threads accuracy interval_value interval_unit
	config_get name "$cfg" name "$cfg"
	config_get_bool speedtest "$cfg" speedtest 0
	config_get threads "$cfg" threads 10
	config_get accuracy "$cfg" accuracy 0.75
	config_get interval_value "$cfg" interval_value 60
	config_get interval_unit "$cfg" interval_unit "m"

	SUB_ITEMS=""
	URL_ITEMS=""
	config_list_foreach "$cfg" subscriptions collect_sub
	config_list_foreach "$cfg" check_urls collect_url

	log ""
	log "==================== group $cfg START ===================="
	touch "$STATE_DIR/running_$cfg"

	if [ ! -x "$BIN" ]; then
		log "ERROR group $cfg: binary $BIN not executable, skipping"
		rm -f "$STATE_DIR/running_$cfg"
		log "==================== group $cfg END (exit=binary-missing) ===================="
		return
	fi

	local configs="$STATE_DIR/configs_$cfg.txt"
	local result="$WWW_DIR/sub_$cfg.txt"
	local subs_ok="$STATE_DIR/subs_ok_$cfg.txt"
	: > "$configs"
	: > "$subs_ok"

	local subs_count=0
	local sub_url
	OLDIFS="$IFS"; IFS="
"
	for sub_url in $SUB_ITEMS; do
		IFS="$OLDIFS"
		[ -z "$sub_url" ] && { IFS="
"; continue; }
		log "fetching sub for $cfg: $sub_url"
		if fetch_subscription "$sub_url" "$configs"; then
			subs_count=$((subs_count + 1))
			echo "$sub_url" >> "$subs_ok"
		else
			log "WARN failed to fetch: $sub_url"
		fi
		IFS="
"
	done
	IFS="$OLDIFS"

	local total_configs
	total_configs=$(grep -cE '^(vless|vmess|trojan|ss|ssr|hysteria2|hysteria|tuic|wireguard|socks|http)://' "$configs" 2>/dev/null)
	[ -z "$total_configs" ] && total_configs=0
	log "group $cfg: $subs_count subs, $total_configs configs"

	check_knife_compat "$cfg" "$configs"

	local secs
	secs=$(interval_to_seconds "$interval_value" "$interval_unit")

	if [ "$total_configs" -eq 0 ]; then
		log "WARN group $cfg: no configs, skipping"
		echo $(( $(date +%s) + secs )) > "$STATE_DIR/next_run_$cfg"
		rm -f "$STATE_DIR/running_$cfg"
		log "==================== group $cfg END (exit=no-configs) ===================="
		return
	fi

	local test_urls=""
	local u
	OLDIFS="$IFS"; IFS="
"
	for u in $URL_ITEMS; do
		[ -z "$u" ] && continue
		if [ -z "$test_urls" ]; then
			test_urls="$u"
		else
			test_urls="$test_urls,$u"
		fi
	done
	IFS="$OLDIFS"

	set -- http -f "$configs" -o "$result" -x txt -t "$threads" --url-success-threshold "$accuracy"
	[ "$speedtest" = "1" ] && set -- "$@" --speedtest
	[ -n "$test_urls" ] && set -- "$@" --test-urls "$test_urls"

	local raw="$STATE_DIR/knife_out_$cfg.log"
	: > "$raw"
	log "running: timeout $KNIFE_TIMEOUT $BIN $*"
	timeout --signal=TERM --kill-after=30 "$KNIFE_TIMEOUT" "$BIN" "$@" > "$raw" 2>&1 &
	CHILD_PID=$!

	# heartbeat: каждые HEARTBEAT_SEC писать «сколько уже рабочих»
	local last_report
	last_report=$(date +%s)
	while kill -0 "$CHILD_PID" 2>/dev/null; do
		sleep 5
		local now done_count
		now=$(date +%s)
		if [ $(( now - last_report )) -ge "$HEARTBEAT_SEC" ]; then
			done_count=0
			[ -f "$result" ] && done_count=$(grep -c . "$result" 2>/dev/null)
			[ -z "$done_count" ] && done_count=0
			log "group $cfg: running, $done_count working so far"
			last_report=$now
		fi
	done
	wait "$CHILD_PID"
	local rc=$?
	CHILD_PID=""

	# отфильтровать прелюдию xray-knife и дописать остальное в общий лог
	if [ -s "$raw" ]; then
		grep -vE "$KNIFE_NOISE_RE" "$raw" >> "$LOG" 2>/dev/null
	fi
	rm -f "$raw"

	# статус
	if [ "$rc" -eq 0 ]; then
		log "group $cfg: OK"
	elif [ "$rc" -eq 124 ]; then
		log "ERROR group $cfg: TIMEOUT after ${KNIFE_TIMEOUT}s"
	elif [ "$rc" -eq 3 ]; then
		log "WARN group $cfg: NO WORKING CONFIGS (all failed)"
	else
		log "ERROR group $cfg: FAILED exit=$rc"
	fi

	if [ -f "$result" ]; then
		awk 'NF' "$result" > "$result.tmp" && mv "$result.tmp" "$result"
	fi
	chmod 644 "$result" 2>/dev/null

	echo $(( $(date +%s) + secs )) > "$STATE_DIR/next_run_$cfg"
	rm -f "$STATE_DIR/running_$cfg"
	log "==================== group $cfg END (exit=$rc) ===================="
}

log "runner.sh started (v7)"

while true; do
	rotate_log

	config_load vpn-checker
	GROUPS=""
	collect_group() { GROUPS="${GROUPS}${1}
"; }
	config_foreach collect_group group

	OLDIFS="$IFS"; IFS="
"
	for cfg in $GROUPS; do
		IFS="$OLDIFS"
		[ -z "$cfg" ] && { IFS="
"; continue; }

		force_file="$STATE_DIR/force_$cfg"
		if [ -f "$force_file" ]; then
			rm -f "$force_file"
			run_check "$cfg"
			sleep 5
			IFS="
"
			continue
		fi
		next_file="$STATE_DIR/next_run_$cfg"
		now=$(date +%s)
		next=$(cat "$next_file" 2>/dev/null || echo 0)
		if [ "$now" -ge "$next" ]; then
			run_check "$cfg"
			sleep 5
		fi
		IFS="
"
	done
	IFS="$OLDIFS"

	sleep 10
done