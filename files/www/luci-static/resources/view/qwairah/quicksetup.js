'use strict';
'require view';'require form';'require uci';'require fs';
function fmtSpd(s,st){var n=parseInt(s,10);if(!isNaN(n)&&n>0&&st!=='down')return (n>=1000?'1 جيجابت/ث':'100 ميجابت/ث')+' ('+n+' Mbps)';return (st==='up')?'مرتبط':'غير مرتبط / مفصول';}
return view.extend({
  load:function(){return Promise.all([uci.load('system'),uci.load('wireless'),fs.read('/proc/meminfo').catch(function(){return '';}),fs.read('/tmp/sysinfo/model').catch(function(){return 'COMFAST CF-WA350';})]);},
  render:function(d){
    var m=d[2]||'',mdl=(d[3]||'COMFAST CF-WA350').trim(),t=0,a=0,f=0;
    m.split(/\r?\n/).forEach(function(l){var x;if((x=l.match(/^MemTotal:\s+(\d+)\s+kB/)))t=+x[1];if((x=l.match(/^MemAvailable:\s+(\d+)\s+kB/)))a=+x[1];if((x=l.match(/^MemFree:\s+(\d+)\s+kB/)))f=+x[1];});
    var banner=E('div',{style:'margin-bottom:12px;padding:10px 14px;background:#022c22;border:1px solid #eab308;border-radius:8px;color:#fef08a;font-weight:bold;'},'QWAIRAH قويره — الموديل: '+mdl+' | المعمارية: ATH79 (5.8GHz=radio0 أولاً، 2.4GHz=radio1 ثانياً)');
    var ramPre=E('pre',{id:'qw-ram-box'},'الإجمالي: '+(t/1024).toFixed(2)+' MiB | المستخدم: '+Math.max(0,(t-a)/1024).toFixed(2)+' MiB ('+(t?(((t-a)/t)*100).toFixed(1):'0.0')+'%) | المتاح: '+(a/1024).toFixed(2)+' MiB (Free: '+(f/1024).toFixed(2)+' MiB)');
    var portPre=E('pre',{id:'qw-ports-box'},'جاري قراءة المنافذ...');
    var map=new form.Map('wireless',_('QWAIRAH Quick Setup — البرمجة السريعة (COMFAST CF-WA350)'));

    var s0=map.section(form.NamedSection,'default_radio0','wifi-iface',_('أولاً: كرت 5.8GHz (radio0 — QWAIRAH 5.8G)'));
    var o=s0.option(form.ListValue,'mode',_('الوضع (Mode)'));o.value('ap','Access Point WDS');o.value('sta','Client WDS');o.value('mesh','802.11s Mesh');
    o=s0.option(form.Flag,'wds',_('تفعيل WDS'));o.default='1';
    o=s0.option(form.Value,'ssid',_('اسم الشبكة (SSID)'));o.default='QWAIRAH 5.8G';
    o=s0.option(form.ListValue,'encryption',_('التشفير'));o.value('none','مفتوحة بدون كلمة سر');o.value('psk2','WPA2-PSK');o.value('sae-mixed','WPA2/WPA3');
    o=s0.option(form.Value,'key',_('كلمة السر'));o.depends('encryption','psk2');o.depends('encryption','sae-mixed');

    var r0=map.section(form.NamedSection,'radio0','wifi-device',_('إعدادات البث 5.8GHz (radio0)'));
    o=r0.option(form.ListValue,'country',_('الدولة'));o.value('PA','Panama (PA)');o.value('DE','Germany (DE)');o.value('US','United States (US)');
    o=r0.option(form.Value,'channel',_('القناة (36-200 / 5520=104)'));o.default='104';
    o=r0.option(form.ListValue,'htmode',_('عرض القناة'));o.value('HT20','20MHz');o.value('HT40','40MHz');o.value('VHT80','80MHz');
    o=r0.option(form.Value,'txpower',_('قوة البث (dBm)'));o.default='23';

    var s1=map.section(form.NamedSection,'default_radio1','wifi-iface',_('ثانياً: كرت 2.4GHz (radio1 — QWAIRAH 2.4G)'));
    var o1=s1.option(form.ListValue,'mode',_('الوضع (Mode)'));o1.value('ap','Access Point WDS');o1.value('sta','Client WDS');o1.value('mesh','802.11s Mesh');
    o1=s1.option(form.Flag,'wds',_('تفعيل WDS'));o1.default='1';
    o1=s1.option(form.Value,'ssid',_('اسم الشبكة (SSID)'));o1.default='QWAIRAH 2.4G';
    o1=s1.option(form.ListValue,'encryption',_('التشفير'));o1.value('none','مفتوحة بدون كلمة سر');o1.value('psk2','WPA2-PSK');o1.value('sae-mixed','WPA2/WPA3');
    o1=s1.option(form.Value,'key',_('كلمة السر'));o1.depends('encryption','psk2');o1.depends('encryption','sae-mixed');

    var r1=map.section(form.NamedSection,'radio1','wifi-device',_('إعدادات البث 2.4GHz (radio1)'));
    o1=r1.option(form.ListValue,'country',_('الدولة'));o1.value('PA','Panama (PA)');o1.value('DE','Germany (DE)');o1.value('US','United States (US)');
    o1=r1.option(form.Value,'channel',_('القناة (1-13)'));o1.default='6';
    o1=r1.option(form.ListValue,'htmode',_('عرض القناة'));o1.value('HT20','20MHz');o1.value('HT40','40MHz');
    o1=r1.option(form.Value,'txpower',_('قوة البث (dBm)'));o1.default='20';

    return map.render().then(function(el){
      el.insertBefore(banner,el.firstChild);
      el.appendChild(E('div',{class:'cbi-section'},[E('h3',{},'Ports & Cable Speed (حالة المنافذ)'),portPre]));
      el.appendChild(E('div',{class:'cbi-section'},[E('h3',{},'RAM Status (حالة الرام)'),ramPre]));
      Promise.all(['eth0','eth1','br-lan'].map(function(n){
        return Promise.all([fs.read('/sys/class/net/'+n+'/operstate').catch(function(){return 'unknown';}),fs.read('/sys/class/net/'+n+'/speed').catch(function(){return '';}),fs.read('/sys/class/net/'+n+'/duplex').catch(function(){return '';})]).then(function(v){
          var st=(v[0]||'unknown').trim(),sp=(v[1]||'').trim(),dp=(v[2]||'').trim();
          var role=(n==='eth1')?'WAN / Port 2':(n==='eth0'?'LAN / Port 1':'Bridge LAN');
          return role+' ('+n+'): الحالة = '+st+' | الكابل = '+fmtSpd(sp,st)+(dp&&st==='up'?' | '+dp:'');
        });
      })).then(function(lines){portPre.textContent=lines.join('\n');});
      return el;
    });
  }
});
