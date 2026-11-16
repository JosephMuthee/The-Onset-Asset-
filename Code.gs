/** THEE onset Enterprise — Version 3.0 Google Sheets backend.
 * Bind this script to the target Google Sheet. Change API_KEY before deployment.
 * Use HTTPS and keep the deployed URL/key private. This backend is a single-owner
 * personal workspace, not a multi-tenant banking-grade service.
 */
const API_KEY = 'CHANGE-THIS-TO-A-LONG-PRIVATE-KEY';
const COLLECTIONS = ['transactions','accounts','assets','debts','repayments','projects','investments','goals','auditLog'];
const TAB_NAMES = {transactions:'Transactions',accounts:'Accounts',assets:'Assets',debts:'Debts',repayments:'Debt Repayments',projects:'Projects',investments:'Investments',goals:'Goals',auditLog:'Audit Log'};
const REVISION_KEY = 'THEE_ONSET_CLOUD_REVISION';
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.values(TAB_NAMES).forEach(name => ensureTab_(ss, name, ['Record ID','Record JSON','Updated At']));
  ensureTab_(ss, 'Businesses', ['Business Name']);
  ensureTab_(ss, 'Settings', ['Key','Value']);
  ensureTab_(ss, 'Sync Log', ['Timestamp','Action','Status']);
  ensureTab_(ss, 'Monthly Reports', ['Month','Business / Entity','Income KES','Expenses KES','Net Cash Flow KES','Updated At']);
  return 'THEE onset Enterprise V3 backend is ready.';
}
function doGet() { return json_({ok:true,app:'THEE onset Enterprise',version:'3.0',message:'Backend is online.'}); }
function doPost(e) {
  let action = 'unknown';
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    action = payload.action || 'save';
    if (!API_KEY || API_KEY.indexOf('CHANGE-THIS') === 0 || payload.key !== API_KEY) throw new Error('Invalid API key. Update API_KEY in Apps Script and the app settings.');
    const ss = SpreadsheetApp.getActiveSpreadsheet(); setup();
    const props = PropertiesService.getScriptProperties();
    if (action === 'load') {
      const data = readState_(ss); const revision = Number(props.getProperty(REVISION_KEY) || 0);
      log_(ss,'load','OK · revision '+revision);
      return json_({ok:true,data:data,revision:revision});
    }
    if (action !== 'save' || !payload.data) throw new Error('Unsupported action or missing data.');
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const current = Number(props.getProperty(REVISION_KEY) || 0);
      if (Number(payload.revision || 0) !== current) throw new Error('Cloud data changed since it was loaded (revision conflict). Reload the cloud copy before uploading to avoid overwriting another device.');
      writeState_(ss,payload.data);
      const next = current + 1; props.setProperty(REVISION_KEY,String(next));
      log_(ss,'save','OK · revision '+next);
      return json_({ok:true,savedAt:new Date().toISOString(),revision:next});
    } finally { lock.releaseLock(); }
  } catch (err) {
    try { log_(SpreadsheetApp.getActiveSpreadsheet(),action,String(err.message || err)); } catch (_) {}
    return json_({ok:false,error:String(err.message || err)});
  }
}
function ensureTab_(ss,name,headers) { let sh=ss.getSheetByName(name); if(!sh)sh=ss.insertSheet(name); if(sh.getLastRow()===0)sh.appendRow(headers); return sh; }
function writeState_(ss,data) {
  COLLECTIONS.forEach(key=>{
    const sh=ensureTab_(ss,TAB_NAMES[key],['Record ID','Record JSON','Updated At']);
    sh.clearContents(); sh.appendRow(['Record ID','Record JSON','Updated At']);
    (data[key]||[]).forEach(record=>sh.appendRow([record.id||Utilities.getUuid(),JSON.stringify(record),record.updatedAt||new Date().toISOString()]));
  });
  const b=ensureTab_(ss,'Businesses',['Business Name']); b.clearContents(); b.appendRow(['Business Name']);
  (data.businesses||[]).forEach(name=>b.appendRow([name]));
  const s=ensureTab_(ss,'Settings',['Key','Value']); s.clearContents(); s.appendRow(['Key','Value']);
  // Never store the API key or local app PIN hash in the spreadsheet.
  s.appendRow(['backendUrl',(data.settings||{}).backendUrl||'']);
  refreshMonthlyReports_(ss,data.transactions||[]);
}
function refreshMonthlyReports_(ss,transactions) {
  const sh=ensureTab_(ss,'Monthly Reports',['Month','Business / Entity','Income KES','Expenses KES','Net Cash Flow KES','Updated At']);
  sh.clearContents(); sh.appendRow(['Month','Business / Entity','Income KES','Expenses KES','Net Cash Flow KES','Updated At']);
  const grouped={};
  transactions.forEach(t=>{const month=String(t.date||'Undated').slice(0,7),business=String(t.business||'Personal'),key=month+'|'+business;if(!grouped[key])grouped[key]={month,business,income:0,expenses:0};if(t.kind==='Income')grouped[key].income+=Number(t.amount||0);if(t.kind==='Expense')grouped[key].expenses+=Number(t.amount||0);});
  const updated=new Date(); Object.keys(grouped).sort().reverse().forEach(key=>{const r=grouped[key];sh.appendRow([r.month,r.business,r.income,r.expenses,r.income-r.expenses,updated]);});
}
function readState_(ss) {
  const data={transactions:[],accounts:[],assets:[],debts:[],repayments:[],projects:[],investments:[],goals:[],auditLog:[],businesses:[],settings:{backendUrl:'',dashboardScope:'All finances'}};
  COLLECTIONS.forEach(key=>{const sh=ss.getSheetByName(TAB_NAMES[key]);if(!sh||sh.getLastRow()<2)return;sh.getRange(2,2,sh.getLastRow()-1,1).getValues().forEach(row=>{if(row[0]){try{data[key].push(JSON.parse(row[0]));}catch(_){}}});});
  const b=ss.getSheetByName('Businesses');if(b&&b.getLastRow()>1)data.businesses=b.getRange(2,1,b.getLastRow()-1,1).getValues().flat().filter(String);
  return data;
}
function log_(ss,action,status){ensureTab_(ss,'Sync Log',['Timestamp','Action','Status']).appendRow([new Date(),action,status]);}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
