local sys = require "luci.sys"
local mdl = (sys.exec("cat /tmp/sysinfo/model 2>/dev/null") or "CF-WA350"):gsub("[\r\n]", "")
local hst = (sys.exec("uci -q get system.@system[0].hostname") or "QWAIRAH"):gsub("[\r\n]", "")
local lan = (sys.exec("uci -q get network.lan.ipaddr") or "192.168.1.1"):gsub("[\r\n]", "")

local info_bar = string.format(
    '<div style="margin-bottom:10px;padding:8px 12px;background:#022c22;border:1px solid #eab308;border-radius:6px;color:#fef08a;font-weight:bold;">Model: %s | Host: %s | LAN: %s</div>',
    mdl, hst, lan
)

local m = Map("wireless", translate("QWAIRAH Quick Setup"), info_bar .. translate("5.8GHz (radio0) & 2.4GHz (radio1) WDS / Mesh / AP / Client"))

local s0 = m:section(NamedSection, "default_radio0", "wifi-iface", translate("5.8GHz Interface (QWAIRAH 5G - radio0)"))
local o = s0:option(ListValue, "mode", translate("Mode"))
o:value("ap", "AP WDS"); o:value("sta", "Client WDS"); o:value("mesh", "802.11s Mesh")
o = s0:option(Flag, "wds", translate("WDS")); o.default = "1"
o = s0:option(Value, "ssid", translate("SSID")); o.default = "QWAIRAH 5G"
o = s0:option(ListValue, "encryption", translate("Encryption"))
o:value("none", "Open (No Password)"); o:value("psk2", "WPA2-PSK"); o:value("sae-mixed", "WPA2/WPA3")
o = s0:option(Value, "key", translate("Password")); o:depends("encryption", "psk2"); o:depends("encryption", "sae-mixed")

local r0 = m:section(NamedSection, "radio0", "wifi-device", translate("5.8GHz Radio Settings (radio0)"))
o = r0:option(ListValue, "country", translate("Country")); o:value("PA", "Panama (PA)"); o:value("US", "United States (US)"); o:value("GB", "United Kingdom (GB)")
o = r0:option(Value, "channel", translate("Channel (1-200)")); o.default = "104"
o = r0:option(ListValue, "htmode", translate("Channel Width"))
o:value("HT20", "20MHz"); o:value("HT40", "40MHz"); o:value("VHT80", "80MHz"); o:value("VHT160", "160MHz")
o = r0:option(Value, "txpower", translate("TX Power (dBm)")); o.default = "30"

if m.uci:get("wireless", "default_radio1") then
    local s1 = m:section(NamedSection, "default_radio1", "wifi-iface", translate("2.4GHz Interface (QWAIRAH 2G - radio1)"))
    o = s1:option(ListValue, "mode", translate("Mode"))
    o:value("ap", "AP WDS"); o:value("sta", "Client WDS"); o:value("mesh", "802.11s Mesh")
    o = s1:option(Flag, "wds", translate("WDS")); o.default = "1"
    o = s1:option(Value, "ssid", translate("SSID")); o.default = "QWAIRAH 2G"
    o = s1:option(ListValue, "encryption", translate("Encryption"))
    o:value("none", "Open (No Password)"); o:value("psk2", "WPA2-PSK"); o:value("sae-mixed", "WPA2/WPA3")
    o = s1:option(Value, "key", translate("Password")); o:depends("encryption", "psk2"); o:depends("encryption", "sae-mixed")

    local r1 = m:section(NamedSection, "radio1", "wifi-device", translate("2.4GHz Radio Settings (radio1)"))
    o = r1:option(ListValue, "country", translate("Country")); o:value("PA", "Panama (PA)"); o:value("US", "United States (US)"); o:value("GB", "United Kingdom (GB)")
    o = r1:option(Value, "channel", translate("Channel (0-15)")); o.default = "6"
    o = r1:option(ListValue, "htmode", translate("Channel Width"))
    o:value("HT10", "10MHz"); o:value("HT20", "20MHz"); o:value("HT40", "40MHz")
    o = r1:option(Value, "txpower", translate("TX Power (dBm)")); o.default = "30"
end

function m.on_after_commit(self)
    sys.call("/sbin/wifi reload >/dev/null 2>&1 &")
end
return m
