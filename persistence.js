'use strict';
// Browser autosave remains synchronous; IndexedDB also remembers the optional disk file.
window.createProgressStorage=({getSnapshot,restoreSnapshot,onStatus,onExistingFile})=>{
 let db=null,handle=null,ready=false,dirty=false,writing=false,paused=false;
 const status=(message,kind='browser')=>onStatus(message,kind);
 const openDB=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('russian-study-progress-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 const read=key=>new Promise((resolve,reject)=>{const r=db.transaction('progress').objectStore('progress').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 const put=(key,value)=>new Promise((resolve,reject)=>{const tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
 async function existingFile(){try{const file=await handle.getFile();if(!file.size)return null;const data=JSON.parse(await file.text());if(data.app==='russian-study-club'&&[1,2].includes(data.version)&&data.state)return data;return {unrecognised:true}}catch{return {unrecognised:true}}}
 async function flush(){if(!ready||!handle||paused||writing)return;writing=true;
  try{if(await handle.queryPermission({mode:'readwrite'})!=='granted'){status('Saved in Chrome · resume file saving','resume');return}
   while(dirty){dirty=false;status('Saved in Chrome · saving file…','saving');const data=JSON.stringify(getSnapshot(),null,2);const out=await handle.createWritable();await out.write(data);await out.close()}
   status('Saved in Chrome + '+handle.name+' · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),'file');
  }catch(err){status('Saved in Chrome · file saving needs attention','resume')}
  finally{writing=false}
 }
 function changed(){const snapshot=getSnapshot();if(db)put('snapshot',snapshot).catch(()=>{});dirty=true;if(handle)void flush();else status('Progress saved in Chrome · connect a file for automatic backup','browser')}
 async function start(){
  try{db=await openDB();const backup=await read('snapshot');if(backup?.state&&(backup.state.updatedAt||0)>(getSnapshot().state.updatedAt||0))restoreSnapshot(backup);handle=await read('file')||null}catch{}
  ready=true;
  if(handle){try{if(await handle.queryPermission({mode:'readwrite'})==='granted'){const file=await existingFile();if(file?.unrecognised){paused=true;status('Progress saved in Chrome · choose a valid progress file','resume');return}
    if(file?.state&&(file.state.updatedAt||0)>(getSnapshot().state.updatedAt||0))restoreSnapshot(file);
    dirty=true;void flush();return
   }}catch{}status('Progress saved in Chrome · resume file saving','resume')}
  else status('Progress saved in Chrome · connect a file for automatic backup','browser');
 }
 async function acceptFile(candidate){handle=candidate;paused=false;if(db)await put('file',handle).catch(()=>{});dirty=true;void flush()}
 async function connect(forceNew=false){
  if(!window.showSaveFilePicker){status('Progress saved in this browser · use Download backup for a file','browser');return}
  try{
   if(handle&&!paused&&!forceNew){const permission=await handle.requestPermission({mode:'readwrite'});if(permission==='granted'){const file=await existingFile();if(file?.unrecognised){paused=true;status('Choose another progress file; this file is not a study backup','resume');return}if(file?.state&&(file.state.updatedAt||0)>(getSnapshot().state.updatedAt||0))restoreSnapshot(file);dirty=true;void flush();return}}
   const candidate=await window.showSaveFilePicker({suggestedName:'russian-study-progress-v1.json',types:[{description:'Russian study progress',accept:{'application/json':['.json']}}]});
   const previous=handle;handle=candidate;const file=await existingFile();handle=previous;
   if(file){const choice=await onExistingFile(file);if(choice==='cancel')return;if(choice==='restore'){restoreSnapshot(file)}}
   await acceptFile(candidate);
  }catch(err){if(err.name!=='AbortError')status('Progress saved in Chrome · couldn’t connect the file','browser')}
 }
 async function disconnect(){handle=null;paused=false;dirty=false;if(db)await put('file',null).catch(()=>{});status('Progress saved in Chrome · file disconnected','browser')}
 return {start,changed,connect,disconnect,flush};
};
