'use strict';
'require view';'require fs';'require ui';
return view.extend({
  render:function(){
    var out=E('pre',{id:'qw-scan-out'},_('اختر التردد لفحص الشبكات القريبة مرتبة حسب الإشارة (COMFAST CF-WA350: radio0=5.8GHz أولاً، radio1=2.4GHz ثانياً).'));
    function doScan(dev,label){
      out.textContent='جاري البحث عن الشبكات في '+label+' ('+dev+')...';
      return fs.exec('/usr/bin/iwinfo',[dev,'scan']).then(function(r){
        out.textContent=(r.stdout||r.stderr||'لا توجد شبكات.').trim();
      }).catch(function(e){out.textContent='خطأ: '+e.message;});
    }
    var b5=E('button',{class:'btn cbi-button-apply',click:function(){return doScan('wlan0','5.8GHz');}},_('فحص 5.8GHz أولاً (wlan0 / radio0)'));
    var b2=E('button',{class:'btn cbi-button-action',style:'margin-left:8px;',click:function(){return doScan('wlan1','2.4GHz');}},_('فحص 2.4GHz ثانياً (wlan1 / radio1)'));
    return E('div',{class:'cbi-map'},[E('h2',{},_('QWAIRAH Channel Scan — فحص القنوات')),E('div',{class:'cbi-section'},[E('p',{},[b5,b2]),out])]);
  },
  handleSaveApply:null,handleSave:null,handleReset:null
});
