const PRICES = { '150cm': 35.99, '180cm': 59.95, 'controle': 35.99, 'controle_suporte': 249.99, 'combo': 249.99, 'padrao': 249.99, 'cadeira': 249.99, 'preta': 249.99, 'vermelha': 215.95 };
const reply = (statusCode, data) => ({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(data)});
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405,{error:'Método não permitido'});
  const apiKey = process.env.STRATONBOT_API_KEY;
  if (!apiKey) return reply(500,{error:'Chave StratonBot não configurada no Netlify'});
  let body;
  try {body=JSON.parse(event.body||'{}');}catch{return reply(400,{error:'JSON inválido'});}
  const variant=body.variant;
  const customer=body.customer||{};
  if (!Object.prototype.hasOwnProperty.call(PRICES,variant)) return reply(400,{error:'Variação inválida'});
  const name=String(customer.name||'').trim();
  const email=String(customer.email||'').trim();
  const document=String(customer.document||'').replace(/\D/g,'');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || document.length!==11) return reply(400,{error:'Confira nome, e-mail e CPF'});
  const orderId='pedido_'+crypto.randomUUID();
  const colorLabel = variant === 'vermelha' ? 'Vermelha' : 'Preta';
  const payload={amount:PRICES[variant],external_id:orderId,description:`Mercado Livre - Cadeira Gamer Dunamis ${colorLabel} Marqs Home`,customer:{name,email,document}};
  try {
    const res=await fetch('https://stratonbot.app/api/public/v1/cashin',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(payload)});
    const raw=await res.text(); let result={};try{result=JSON.parse(raw)}catch{}
    if (!res.ok) return reply(res.status,{error:result.message||result.error||result.code||`StratonBot retornou HTTP ${res.status}`});
    const data=result.data||{};
    if (!data.transaction_id||!data.pix_code) return reply(502,{error:'Resposta PIX incompleta da StratonBot'});
    return reply(200,{id:data.transaction_id,pixCode:data.pix_code,qrCode:data.qr_code,status:data.status,expiresAt:data.expires_at});
  }catch{return reply(502,{error:'Falha de comunicação com a StratonBot'});}
};
