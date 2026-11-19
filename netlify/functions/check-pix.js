const reply=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(data)});
exports.handler=async(event)=>{
  if(event.httpMethod!=='GET') return reply(405,{error:'Método não permitido'});
  const apiKey=process.env.STRATONBOT_API_KEY;
  if(!apiKey) return reply(500,{error:'Chave StratonBot não configurada no Netlify'});
  const id=String(event.queryStringParameters?.id||'');
  if(!/^tx_[a-zA-Z0-9_-]{3,128}$/.test(id)) return reply(400,{error:'ID de transação inválido'});
  try{
    const res=await fetch('https://stratonbot.app/api/public/v1/cashin/'+encodeURIComponent(id),{headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},redirect:'error'});
    const raw=await res.text();let result={};try{result=JSON.parse(raw)}catch{}
    if(!res.ok) return reply(res.status,{error:result.message||result.error||`Consulta retornou HTTP ${res.status}`});
    return reply(200,{status:result.data?.status||result.status||'unknown'});
  }catch{return reply(502,{error:'Falha ao consultar a StratonBot'});}
};
