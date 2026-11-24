#!/bin/sh
CONF="/etc/qwairah_tg.conf"
[ -f "$CONF" ] && . "$CONF"
[ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ] && exit 0

MODE="${1:-boot}"
DETAIL="${2:-}"
NODE="${NODE_NAME:-$(uci -q get system.@system[0].hostname || echo QWAIRAH-CF-WA350)}"
MODEL="$(cat /tmp/sysinfo/model 2>/dev/null || echo 'COMFAST CF-WA350')"
LAN_IP="$(ip -4 addr show br-lan 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)"
[ -z "$LAN_IP" ] && LAN_IP="$(uci -q get network.lan.ipaddr || echo '192.168.1.1')"
WAN_IP="$(ip -4 route get 1.1.1.3 2>/dev/null | awk '/src/ {for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1)"
DHCP_STATE=$([ "$(uci -q get dhcp.lan.ignore)" = "1" ] && echo "معطل (OFF)" || echo "شغال (ON)")
WIFI_5G="$(uci -q get wireless.default_radio0.ssid || echo 'QWAIRAH 5.8G')"
WIFI_2G="$(uci -q get wireless.default_radio1.ssid || echo 'QWAIRAH 2.4G')"
PORTS=$(for d in /sys/class/net/*; do
  n=$(basename "$d")
  case "$n" in lo) continue ;; esac
  st=$(cat "$d/operstate" 2>/dev/null || echo "down")
  sp=$(cat "$d/speed" 2>/dev/null)
  [ -n "$sp" ] && [ "$sp" -gt 0 ] 2>/dev/null && printf "%s:%s(%sMb) " "$n" "$st" "$sp" || printf "%s:%s " "$n" "$st"
done)

if [ "$MODE" = "shutdown" ]; then
  RAW=$(printf '🔴 تنبيه إطفاء / إعادة تشغيل — شبكة قـويــره نت\nالموديل: %s\nالعقدة: %s\nآي بي LAN: %s\nآي بي WAN: %s' "$MODEL" "$NODE" "${LAN_IP:-غير متاح}" "${WAN_IP:-غير متاح}")
  TIMEOUT=5
elif [ "$MODE" = "test" ]; then
  RAW=$(printf '✅ اختبار تنبيه — شبكة قـويــره نت\nالموديل: %s\nالعقدة: %s\nآي بي LAN: %s\nآي بي WAN: %s\nحالة DHCP: %s\nالواي فاي: 5.8G=%s | 2.4G=%s\nالمنافذ: %s\nالحالة: السكربت يعمل بنجاح' "$MODEL" "$NODE" "${LAN_IP:-غير متاح}" "${WAN_IP:-غير متاح}" "$DHCP_STATE" "$WIFI_5G" "$WIFI_2G" "${PORTS:-لا يوجد}")
  TIMEOUT=10
elif [ "$MODE" = "event" ]; then
  RAW=$(printf '🔔 تنبيه حدث — شبكة قـويــره نت\nالموديل: %s\nالعقدة: %s\nآي بي LAN: %s\nحالة DHCP: %s\nالتفاصيل: %s' "$MODEL" "$NODE" "${LAN_IP:-غير متاح}" "$DHCP_STATE" "${DETAIL:-تحديث}")
  TIMEOUT=10
else
  i=0
  while [ $i -lt 15 ]; do
    ping -c 1 -W 2 1.1.1.3 >/dev/null 2>&1 && break
    sleep 3
    i=$((i + 1))
  done
  P_AVG="$(ping -c 4 -W 2 1.1.1.3 2>/dev/null | awk -F/ '/round-trip|rtt/ {print $5}' | head -n1)"
  RAW=$(printf '🟢 تقرير تشغيل العقدة — شبكة قـويــره نت\nالموديل: %s\nالعقدة: %s\nآي بي LAN: %s\nآي بي WAN: %s\nحالة DHCP: %s\nالواي فاي: 5.8G=%s | 2.4G=%s\nالمنافذ: %s\nالبينج (1.1.1.3): %s ms' "$MODEL" "$NODE" "${LAN_IP:-غير متاح}" "${WAN_IP:-غير متاح}" "$DHCP_STATE" "$WIFI_5G" "$WIFI_2G" "${PORTS:-لا يوجد}" "${P_AVG:-انتهت المهلة}")
  TIMEOUT=12
fi

if command -v curl >/dev/null 2>&1; then
  curl -sS --max-time "$TIMEOUT" -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${RAW}"
  exit $?
fi

url_encode_bytes() {
  LC_ALL=C hexdump -v -e '/1 "%02X\n"' | awk '
    BEGIN {
      for (i = 0; i < 16; i++) h[sprintf("%X", i)] = i
      for (c = 32; c < 127; c++) ch[c] = sprintf("%c", c)
    }
    /^[0-9A-Fa-f]{2}$/ {
      u = toupper($0)
      b = h[substr(u, 1, 1)] * 16 + h[substr(u, 2, 1)]
      if ((b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122) || b == 45 || b == 46 || b == 95 || b == 126) printf "%s", ch[b]
      else if (b == 32) printf "+"
      else printf "%%%s", u
    }
  '
}

ENC=$(printf '%s' "$RAW" | url_encode_bytes)
URL="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${ENC}"

if command -v uclient-fetch >/dev/null 2>&1; then
  uclient-fetch -T "$TIMEOUT" -q -O - "$URL"
elif command -v wget >/dev/null 2>&1; then
  wget -T "$TIMEOUT" -qO - "$URL"
else
  echo "No HTTP client found" >&2
  exit 1
fi
