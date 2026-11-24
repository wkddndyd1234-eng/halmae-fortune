import {lunarToSolar} from './lunar-conversion.mjs';
const key = 'halmae-free-birth';
const pad = value => String(value).padStart(2,'0');

export function todayInKorea(now=Date.now()) {
  return new Date(now+9*60*60*1000).toISOString().slice(0,10);
}

export function validateBirthDraft(input,today=todayInKorea()) {
  if (typeof input?.name !== 'string' || typeof input.birthDate !== 'string' ||
      typeof input.birthTime !== 'string' || !['male','female'].includes(input.gender)) return null;
  const name = input.name.trim();
  const {birthDate,birthTime} = input;
  const calendarType=input.calendarType??'solar';
  const isLeapMonth=input.isLeapMonth===true||input.isLeapMonth==='true';
  if(!['solar','lunar'].includes(calendarType)||(calendarType==='solar'&&isLeapMonth))return null;
  if (name.length>20 || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      birthDate<'1900-01-01' || birthDate>'2050-12-31' || (calendarType==='solar'&&birthDate>today) ||
      (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime))) return null;
  if(calendarType==='lunar'){try{if(lunarToSolar({birthDate,isLeapMonth}).solarDate>today)return null;}catch{return null;}}
  const instant = new Date(birthDate+'T00:00:00Z');
  if (calendarType==='solar'&&(!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0,10)!==birthDate)) return null;
  return {name,birthDate,birthTime,gender:input.gender,calendarType,isLeapMonth};
}

export function fromFreeForm({name,gender,calendarType='solar',isLeapMonth=false,year,month,day,hour,minute}) {
  return validateBirthDraft({
    name,gender,calendarType,isLeapMonth,birthDate:`${year}-${pad(month)}-${pad(day)}`,
    birthTime:hour===''?'':`${pad(hour)}:${pad(minute)}`,
  });
}

export function saveBirthDraft(draft) {
  try {
    if (draft) sessionStorage.setItem(key,JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch { /* Checkout still works when storage is unavailable. */ }
}

export function readBirthDraft() {
  try { return validateBirthDraft(JSON.parse(sessionStorage.getItem(key))); }
  catch { return null; }
}
