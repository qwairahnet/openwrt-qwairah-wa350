'use strict';
'require view';'require fs';'require ui';
return view.extend({
  render:function(){
    var inp=E('input',{id:'qw-host',type:'text',value:'1.1.1.3',placeholder:'1.1.1.3 or 192.168.5.1'});
    var out=E('pre',{id:'qw-tools-out'},_('اختر Ping أو Local Speed أو Internet Speed.'));
    var clientsPre=E('pre',{id:'qw-clients-out'},_('جاري تحميل الأجهزة المتصلة واستهلاك البيانات...'));
    var pBtn=E('button',{class:'btn cbi-button-apply',click:function(){
      var h=(inp.value||'1.1.1.3').trim().replace(/[^a-zA-Z0-9.-]/g,'')||'1.1.1.3';
      out.textContent='جاري البينج إلى '+h+'...';
      return fs.exec('/bin/ping',['-c','4','-W','2',h]).then(function(r){out.textContent=((r.stdout||'')+(r.stderr||'')).trim()||'تم.';}).catch(function(e){ui.addNotification(null,E('p',e.message));});
    }},_('Ping (4x)'));
    var sBtn=E('button',{class:'btn cbi-button-action',style:'margin-left:8px;',click:function(){
      out.textContent='جاري قياس السرعة المحلية...';
      var t0=performance.now();
      return fetch('/luci-static/resources/ui.js?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.blob();}).then(function(b){
        var sec=Math.max((performance.now()-t0)/1000,0.001);
        out.textContent='الحجم: '+(b.size/(1024*1024)).toFixed(3)+' MB\nالزمن: '+sec.toFixed(3)+' s\nالسرعة: '+(b.size/(1024*1024)/sec).toFixed(2)+' MB/s';
      });
    }},_('Local Speed'));
    var netBtn=E('button',{class:'btn cbi-button-save',style:'margin-left:8px;',click:function(){
      out.textContent='جاري قياس سرعة الإنترنت...';
      return fs.exec('/usr/bin/curl',['-sS','-w','سرعة التحميل: %{speed_download} B/s | الزمن: %{time_total}s | HTTP: %{http_code}\n','-o','/dev/null','--max-time','15','http://speed.cloudflare.com/__down?bytes=5000000']).then(function(r){
        out.textContent=((r.stdout||'')+(r.stderr||'')).trim()||'تم.';
      });
    }},_('Internet Speed'));

    Promise.all([
      fs.read('/proc/net/arp').catch(function(){return '';}),
      fs.read('/tmp/dhcp.leases').catch(function(){return '';}),
      Promise.all(['eth0','eth1','br-lan','wlan0','wlan1'].map(function(n){
        return Promise.all([
          fs.read('/sys/class/net/'+n+'/operstate').catch(function(){return 'down';}),
          fs.read('/sys/class/net/'+n+'/statistics/rx_bytes').catch(function(){return '0';}),
          fs.read('/sys/class/net/'+n+'/statistics/tx_bytes').catch(function(){return '0';})
        ]).then(function(v){
          var rx=(parseInt(v[1],10)||0)/(1024*1024),tx=(parseInt(v[2],10)||0)/(1024*1024);
          return n+' ['+v[0].trim()+']: RX = '+rx.toFixed(2)+' MB | TX = '+tx.toFixed(2)+' MB';
        });
      }))
    ]).then(function(res){
      clientsPre.textContent='=== استهلاك المنافذ والوايرلس ===\n'+res[2].join('\n')+'\n\n=== الأجهزة المتصلة (IP & MAC) ===\n'+(res[0].trim()||'لا يوجد')+'\n\n=== أسماء الأجهزة (DHCP) ===\n'+(res[1].trim()||'DHCP معطل');
    });

    return E('div',{class:'cbi-map'},[
      E('h2',{},_('QWAIRAH Ping & Speed')),
      E('div',{class:'cbi-section'},[E('div',{class:'cbi-value'},[E('label',{class:'cbi-value-title'},_('Target Host')),E('div',{class:'cbi-value-field'},inp)]),E('p',{},[pBtn,sBtn,netBtn]),out]),
      E('div',{class:'cbi-section'},[E('h3',{},_('Clients & Traffic Usage (الأجهزة المتصلة والاستهلاك)')),clientsPre])
    ]);
  },
  handleSaveApply:null,handleSave:null,handleReset:null
});
