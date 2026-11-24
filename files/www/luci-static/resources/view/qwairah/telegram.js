'use strict';
'require view';'require fs';'require ui';
function parseConf(t){var c={BOT_TOKEN:'',CHAT_ID:'',NODE_NAME:'QWAIRAH-CF-WA350'};(t||'').split(/\r?\n/).forEach(function(l){var m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);if(m)c[m[1]]=m[2];});return c;}
return view.extend({
  load:function(){return fs.read('/etc/qwairah_tg.conf').catch(function(){return 'BOT_TOKEN=""\nCHAT_ID=""\nNODE_NAME="QWAIRAH-CF-WA350"\n';});},
  render:function(txt){
    var ta=E('textarea',{style:'width:100%;min-height:120px;font-family:monospace;'},[txt||'']);
    var out=E('pre',{id:'qw-tg-out'},_('احفظ التوكن والشات آي دي ثم اضغط Send Test.'));
    var saveB=E('button',{class:'btn cbi-button-save',click:function(){
      return fs.write('/etc/qwairah_tg.conf',((ta.value||'').trim())+'\n').then(function(){ui.addNotification(null,E('p',_('تم حفظ /etc/qwairah_tg.conf')),'info');});
    }},_('Save Config'));
    var testB=E('button',{class:'btn cbi-button-apply',style:'margin-left:8px;',click:function(){
      var c=parseConf(ta.value);
      if(!c.BOT_TOKEN||!c.CHAT_ID){out.textContent='يرجى إدخال BOT_TOKEN و CHAT_ID.';return;}
      out.textContent='جاري إرسال رسالة اختبار عربية...';
      return fs.exec('/usr/bin/qwairah-tg-notify.sh',['test']).then(function(r){
        out.textContent=((r.stdout||'')+(r.stderr||'')).trim()||'تم الإرسال بنجاح.';
      });
    }},_('Send Test'));
    return E('div',{class:'cbi-map'},[E('h2',{},_('QWAIRAH Telegram Bot')),E('div',{class:'cbi-section'},[ta,E('p',{style:'margin-top:10px;'},[saveB,testB]),out])]);
  },
  handleSaveApply:null,handleSave:null,handleReset:null
});
