'use strict';
'require view';'require fs';'require ui';
return view.extend({
  load:function(){return fs.read('/etc/crontabs/root').catch(function(){return '';});},
  render:function(cronTxt){
    var m=(cronTxt||'').match(/^(\d+)\s+(\d+)\s+\*\s+\*\s+\*\s+\/sbin\/reboot.*qwairah_auto_reboot/m);
    var en=E('input',{type:'checkbox',checked:!!m});
    var hr=E('input',{type:'number',min:'0',max:'23',value:m?m[2]:'4',style:'width:80px;'});
    var mn=E('input',{type:'number',min:'0',max:'59',value:m?m[1]:'0',style:'width:80px;'});
    var saveB=E('button',{class:'btn cbi-button-save',click:function(){
      var lines=(cronTxt||'').split(/\r?\n/).filter(function(l){return l.trim()&&l.indexOf('qwairah_auto_reboot')===-1;});
      if(en.checked){lines.push((parseInt(mn.value,10)||0)+' '+(parseInt(hr.value,10)||4)+' * * * /sbin/reboot # qwairah_auto_reboot');}
      return fs.write('/etc/crontabs/root',(lines.length?lines.join('\n')+'\n':'')).then(function(){
        return fs.exec('/etc/init.d/cron',['restart']).catch(function(){});
      }).then(function(){ui.addNotification(null,E('p',_('تم حفظ جدول إعادة التشغيل التلقائي بنجاح')),'info');});
    }},_('Save Schedule'));
    return E('div',{class:'cbi-map'},[
      E('h2',{},_('QWAIRAH Scheduled Reboot — إعادة التشغيل التلقائي')),
      E('div',{class:'cbi-section'},[
        E('div',{class:'cbi-value'},[E('label',{class:'cbi-value-title'},_('تفعيل إعادة التشغيل التلقائي')),E('div',{class:'cbi-value-field'},en)]),
        E('div',{class:'cbi-value'},[E('label',{class:'cbi-value-title'},_('الساعة (0-23)')),E('div',{class:'cbi-value-field'},hr)]),
        E('div',{class:'cbi-value'},[E('label',{class:'cbi-value-title'},_('الدقيقة (0-59)')),E('div',{class:'cbi-value-field'},mn)]),
        E('p',{},[saveB])
      ])
    ]);
  },
  handleSaveApply:null,handleSave:null,handleReset:null
});
