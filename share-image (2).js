/* 5단계: SNS 9:16 PNG 생성. 외부 이미지·폰트 요청 없이 Canvas API만 사용합니다. */
(function(root){
 'use strict';
 const WIDTH=1080,HEIGHT=1920;
 function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
 function text(ctx,value,x,y,maxWidth,size=42,weight=600,color='#183D35'){
  ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
  ctx.textBaseline='top';ctx.fillText(String(value),x,y,maxWidth);
 }
 function wrap(ctx,value,x,y,maxWidth,lineHeight,maxLines=3){
  const chars=Array.from(String(value));let line='',lines=0;
  for(const ch of chars){if(ctx.measureText(line+ch).width>maxWidth&&line){text(ctx,line,x,y+lines*lineHeight,maxWidth,54,700);lines++;line='';if(lines>=maxLines-1)break;}line+=ch;}
  if(lines<maxLines)text(ctx,line+(chars.length>line.length&&lines===maxLines-1?'…':''),x,y+lines*lineHeight,maxWidth,54,700);
 }
 function draw(canvas,data){
  canvas.width=WIDTH;canvas.height=HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas를 사용할 수 없어요.');
  const bg=ctx.createLinearGradient(0,0,WIDTH,HEIGHT);bg.addColorStop(0,'#E6FAF2');bg.addColorStop(.6,'#D8F3EC');bg.addColorStop(1,'#F7F0FF');ctx.fillStyle=bg;ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#B9E7D8';ctx.beginPath();ctx.arc(960,180,280,0,Math.PI*2);ctx.fill();ctx.fillStyle='#F9E7C9';ctx.beginPath();ctx.arc(40,1650,230,0,Math.PI*2);ctx.fill();
  roundRect(ctx,72,92,936,1700,64,'#FFFFFF');
  roundRect(ctx,124,154,310,72,36,'#D8F5E8');text(ctx,'✳  같이가 GATIGA',148,172,270,30,800,'#218C70');
  text(ctx,'우리, 거의 다 왔어!',124,285,820,68,800);
  wrap(ctx,data.title,124,390,820,74,2);
  text(ctx,`${data.date}  ${data.time}`,124,562,830,36,500,'#68837B');
  roundRect(ctx,124,660,832,130,32,'#E8F9F2');text(ctx,'모두 도착 예정',160,688,740,32,600,'#4C8976');text(ctx,data.everyone,160,730,740,44,800);
  text(ctx,'친구들의 도착 현황',124,850,800,44,800);
  const maxRows=7;
  const people=data.people.slice(0,maxRows);
  people.forEach((p,i)=>{
   const y=940+i*104;roundRect(ctx,124,y,832,88,26,i%2===0?'#F3F9F7':'#FAFCFB');
   roundRect(ctx,145,y+19,48,48,24,['#C4F0E0','#FCE4D9','#E9E1FB','#FFF1C9'][i%4]);
   text(ctx,p.alias,217,y+24,300,32,700);
   ctx.textAlign='right';text(ctx,p.eta,920,y+24,360,30,700,p.arrived?'#258B70':'#3C6359');ctx.textAlign='left';
  });
  if(data.people.length>maxRows)text(ctx,`외 ${data.people.length-maxRows}명`,150,1690,760,30,500,'#71877E');
  text(ctx,`가장 먼저 도착 예정  ${data.first}`,124,1740,830,30,600,'#416E61');
  text(ctx,'데모 모드 · 예시 도착 현황',124,1840,820,28,500,'#547C6F');
  return canvas;
 }
 function toBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('이미지 변환에 실패했어요.')),'image/png'));}
 function saveBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 root.GachigaShareImage={WIDTH,HEIGHT,draw,toBlob,saveBlob};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.GachigaShareImage;
})(globalThis);
