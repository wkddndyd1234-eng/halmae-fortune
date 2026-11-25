export const profiles=[
 ...Array.from({length:30},(_,i)=>({
  birthDate:new Date(Date.UTC(1931+i*3,i%12,8+i%19)).toISOString().slice(0,10),
  birthTime:['','00:00','23:59','09:30','13:59','14:00'][i%6],
  gender:i%2?'male':'female',
 })),
 {birthDate:'2023-02-01',birthTime:'12:00',gender:'female',calendarType:'lunar',isLeapMonth:true},
 {birthDate:'2023-02-01',birthTime:'12:00',gender:'male',calendarType:'lunar',isLeapMonth:false},
 {birthDate:'1988-10-08',birthTime:'',gender:'male'},
 {birthDate:'2024-02-04',birthTime:'17:26',gender:'female'},
 {birthDate:'2024-02-04',birthTime:'17:28',gender:'female'},
 {birthDate:'2024-02-29',birthTime:'23:00',gender:'male'},
];
