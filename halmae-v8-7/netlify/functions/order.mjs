
import crypto from 'node:crypto';
import {orders,json,parse,error} from './shared.mjs';

const PRICE = 29900;

export default async (req) => {
  if (req.method !== 'POST') {
    return json({error:'Method not allowed'},405);
  }

  try {
    const x = await parse(req);

    const name = String(x.name || '').trim().slice(0,30);
    const birthDate = String(x.birthDate || '');
    const birthTime = String(x.birthTime || '');
    const calendarType = String(x.calendarType || 'solar');
    const gender = String(x.gender || '');
    const isLeapMonth =
      x.isLeapMonth === 'true' || x.isLeapMonth === true;

    if (
      !name ||
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) ||
      !['solar','lunar'].includes(calendarType) ||
      !['male','female'].includes(gender) ||
      (calendarType === 'solar' && isLeapMonth)
    ) {
      return json({error:'입력값을 확인해 주세요.'},400);
    }

    const date = new Date(birthDate + 'T00:00:00Z');

    if (
      !Number.isFinite(+date) ||
      date.toISOString().slice(0,10) !== birthDate ||
      date > new Date() ||
      Number(birthDate.slice(0,4)) < 1900
    ) {
      return json({error:'생년월일이 올바르지 않습니다.'},400);
    }

    // 음력 날짜와 윤달의 유효성은
    // 만세력 계산 엔진 연결 시 추가 검증합니다.
    const orderId = 'HM-' + crypto.randomUUID();

    await orders().setJSON(orderId,{
      orderId,
      name,
      birthDate,
      birthTime,
      calendarType,
      isLeapMonth,
      gender,
      amount:PRICE,
      status:'pending',
      createdAt:Date.now()
    });

    return json({
      orderId,
      amount:PRICE,
      status:'pending',
      paymentEnabled:false
    });

  } catch(e) {
    return error(e);
  }
};
