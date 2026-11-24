document.addEventListener('click',function(e){
  var t=e.target.closest('#topmenu>li.dropdown>a');if(!t)return;
  var li=t.parentElement,sub=li.querySelector('.dropdown-menu');if(!sub)return;
  e.preventDefault();var op=li.classList.contains('open');
  document.querySelectorAll('#topmenu>li.dropdown.open').forEach(function(x){if(x!==li)x.classList.remove('open');});
  li.classList.toggle('open',!op);
});
(function(){
  function fmtSpd(s,st){var n=parseInt(s,10);if(!isNaN(n)&&n>0&&st!=='down')return (n>=1000?'1 جيجابت/ث':'100 ميجابت/ث')+' ('+n+' Mbps)';return (st==='up')?'مرتبط':'غير مرتبط / مفصول';}
  function ubus(obj,fn,p){
    var sid=(window.L&&L.env&&L.env.sessionid)||'00000000000000000000000000000000';
    return fetch('/ubus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method:'call',params:[sid,obj,fn,p||{}]})})
      .then(function(r){return r.json();}).then(function(j){return (j&&j.result&&j.result[0]===0)?(j.result[1]||{}):null;}).catch(function(){return null;});
  }
  function mountBox(){
    var ok=/\/status\/overview\/?$/.test(location.pathname)||/\/admin\/status\/?$/.test(location.pathname)||!!document.querySelector('.cbi-map');
    if(!ok||document.getElementById('qw-overview-ports-card'))return;
    var host=document.querySelector('#maincontent .cbi-map')||document.querySelector('#maincontent')||document.body;
    var card=document.createElement('div');card.id='qw-overview-ports-card';card.className='cbi-section';
    card.style.cssText='margin:14px 0;padding:12px;background:rgba(7,36,32,0.92);border:1px solid rgba(234,179,8,.65);border-radius:6px;';
    var h=document.createElement('h3');h.textContent='المنافذ والرام (Ports, Cable Speed & RAM)';h.style.cssText='margin:0 0 8px 0;color:#fef08a;';
    var pre=document.createElement('pre');pre.id='qw-overview-ports-pre';pre.textContent='جاري التحميل...';
    card.appendChild(h);card.appendChild(pre);host.appendChild(card);
  }
  function refresh(){
    mountBox();var pre=document.getElementById('qw-overview-ports-pre');if(!pre)return;
    var ramP=ubus('file','read',{path:'/proc/meminfo'}).then(function(r){
      var m=(r&&r.data)||'',t=0,a=0;
      m.split(/\r?\n/).forEach(function(l){var x;if((x=l.match(/^MemTotal:\s+(\d+)\s+kB/)))t=+x[1];if((x=l.match(/^MemAvailable:\s+(\d+)\s+kB/)))a=+x[1];});
      return t?'الرام: المستخدم '+Math.max(0,(t-a)/1024).toFixed(2)+' MiB / الإجمالي '+(t/1024).toFixed(2)+' MiB (المتاح '+(a/1024).toFixed(2)+' MiB)':'الرام: غير متاح';
    });
    var portsP=Promise.all(['eth0','eth1','br-lan'].map(function(n){
      return Promise.all([ubus('file','read',{path:'/sys/class/net/'+n+'/operstate'}),ubus('file','read',{path:'/sys/class/net/'+n+'/speed'}),ubus('file','read',{path:'/sys/class/net/'+n+'/duplex'})]).then(function(v){
        var st=(v[0]&&v[0].data?v[0].data.trim():'unknown'),sp=(v[1]&&v[1].data?v[1].data.trim():''),dp=(v[2]&&v[2].data?v[2].data.trim():'');
        var role=(n==='eth1')?'WAN / Port 2':(n==='eth0'?'LAN / Port 1':'Bridge LAN');
        return role+' ('+n+'): الحالة = '+st+' | الكابل = '+fmtSpd(sp,st)+(dp&&st==='up'?' | '+dp:'');
      });
    }));
    Promise.all([ramP,portsP]).then(function(res){pre.textContent=res[0]+'\n----------------------------------------\n'+res[1].join('\n');});
  }
  window.addEventListener('load',function(){setTimeout(refresh,500);setInterval(refresh,10000);});
})();
