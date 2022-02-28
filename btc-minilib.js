let crypto = require("crypto"); let base58 = require("./Base58.js"); let fs = require("fs");
let bech32 = require('./bech32.js'); const fetch = require('./fetch-2.6.1.js'); //^2.6.1

module.exports={wif:{}, getaddress:{}, mnemonic:{}}; let currpath=__dirname;
module.exports.wif.encode = function(key, length, prefix="80")
{ if(length==52){ key = prefix+key+"01"; }else{ key = prefix+key; } let res = crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex");
  res = crypto.createHash("sha256").update(Buffer.from(res, "hex")).digest("hex").slice(0, 8);
  return base58.encode(Buffer.from(key+res, "hex")); }
module.exports.wif.decode = function(key){ return Buffer.from(base58.decode(key)).toString("hex").slice(2, 66); }

module.exports.genPrivateKey = function(){ return crypto.randomBytes(32).toString("hex"); }
module.exports.getPublicKey = function(privKey, iscompressed){
	let iscompr = ""; if(iscompressed){ iscompr="compressed"; }
	let pubkey = crypto.createECDH('secp256k1').setPrivateKey(Buffer.from(privKey, 'hex')).getPublicKey(null, iscompr).toString("hex");
	return pubkey; }

module.exports.getaddress.p2pkh = function(privKey, compressed, prefix="00"){
	let iscompr = ""; if(compressed){ iscompr="compressed"; }
	let resp = crypto.createECDH('secp256k1').setPrivateKey(Buffer.from(privKey, 'hex')).getPublicKey(null, iscompr);
	resp = crypto.createHash('sha256').update(resp).digest(); resp = crypto.createHash('ripemd160').update(resp).digest();
	resp = Buffer.from(prefix+resp.toString("hex"), "hex");
	resp=resp.toString("hex")+crypto.createHash('sha256').update(crypto.createHash('sha256').update(resp).digest()).digest("hex").slice(0, 8);
	return base58.encode(Buffer.from(resp, "hex"));
}

module.exports.getaddress.p2wpkh = function(privKey, prefix="bc"){
	let resp = crypto.createECDH('secp256k1').setPrivateKey(Buffer.from(privKey, 'hex')).getPublicKey(null, "compressed");
	resp = crypto.createHash('sha256').update(resp).digest(); resp = crypto.createHash('ripemd160').update(resp).digest();
	let rarr = [], tmp="";
	for(let i=0;i<20;i++){ let tmp1=Number("0x"+resp.subarray(0,1).toString("hex")).toString(2); 
		for(let i1=tmp1.length;i1<8;i1++){ tmp1="0"+tmp1; } tmp+=tmp1; resp=resp.subarray(1); }
	for(let i=0;i<160;i+=5){ rarr.push(parseInt(tmp.slice(0,5), 2)); tmp=tmp.slice(5); }
	rarr.unshift(0); return bech32.encode(prefix, rarr, "bech32");
}

module.exports.getaddress.p2sh = function(privKey, prefix="05"){
	let resp = crypto.createECDH('secp256k1').setPrivateKey(Buffer.from(privKey, 'hex')).getPublicKey(null, "compressed");
	resp = crypto.createHash('sha256').update(resp).digest(); resp = crypto.createHash('ripemd160').update(resp).digest();
	resp = Buffer.from('0014'+resp.toString("hex"), "hex"); resp = crypto.createHash('sha256').update(resp).digest();
	resp = crypto.createHash('ripemd160').update(resp).digest(); resp = Buffer.from(prefix+resp.toString("hex"), "hex");
	resp=resp.toString("hex")+crypto.createHash('sha256').update(crypto.createHash('sha256').update(resp).digest()).digest("hex").slice(0, 8);
	return base58.encode(Buffer.from(resp, "hex"));
}

module.exports.mnemonic.sha256 = function(word){ return crypto.createHash('sha256').update(word).digest("hex"); };
module.exports.mnemonic.gen = function(length, isfast){ 
	if(!this.words){ this.words = fs.readFileSync(currpath+"/english.txt", "utf8").split("\n"); }
	let txt=""; for(let i=0;i<length;i++){ if(i>0){txt+=" ";} if(isfast){txt+=this.words[randomInteger(0, this.words.length-1)];}
		else{ txt+=this.words[randInt4b(0, this.words.length-1)]; } }
	return txt; }

module.exports.request = async function(type, data, options={})
{	if(type=="address")
	{	if((!options.syte||options.syte=="blockchain.info")&&!options.testnet)
		{	let resp = await fetch("https://blockchain.info/address/"+data+"?format=json&limit=0"); 
			try{ resp=await resp.json(); }catch{ return Promise.reject({message:"JSON parse error"}); }	
			resp.received = resp.total_received;  if(resp.received>0){ resp.received=Number(resp.received/100000000).toFixed(8); }
			resp.balance = resp.final_balance; if(resp.balance>0){ resp.balance=Number(resp.balance/100000000).toFixed(8); }
			return resp; }
		if(options.syte=="blockstream.info"||(options.testnet&&!options.syte))
		{	url = "https://blockstream.info/api/"; if(options.testnet){ url = "https://blockstream.info/testnet/api/"; }
			let resp = await fetch(url+"address/"+data);
			try{ resp=await resp.json(); }catch{ return Promise.reject({message:"JSON parse error"}); }	
			if(resp.error){ return Promise.reject({message:resp.error}); } resp.n_tx=resp.chain_stats.tx_count;
			resp.received = resp.chain_stats.funded_txo_sum;  if(resp.received>0){ resp.received=Number(resp.received/100000000).toFixed(8); }
			resp.balance = resp.chain_stats.funded_txo_sum-resp.chain_stats.spent_txo_sum; 
			if(resp.balance>0){ resp.balance=Number(resp.balance/100000000).toFixed(8); } return resp; }
		if(options.syte=="bitaps.com")
		{	let url = "https://api.bitaps.com/btc/v1/blockchain/"; if(options.testnet){ url = "https://api.bitaps.com/btc/testnet/v1/blockchain/"; }
			let resp = await fetch(url+"address/state/"+data); try{ resp=await resp.json(); }catch{ return Promise.reject({message:"JSON parse error"}); }	
			resp.data.received = resp.data.receivedAmount; if(resp.data.received>0){ resp.data.received=Number(resp.data.received/100000000).toFixed(8); }
			if(resp.data.balance>0){ resp.data.balance=Number(resp.data.balance/100000000).toFixed(8); } resp.data.n_tx = resp.data.receivedTxCount+resp.data.sentTxCount;
			resp.data.address=data; return resp.data; }
		if(options.syte=="mempool.space")
		{	url = "https://mempool.space/api/"; if(options.testnet){ url = "https://mempool.space/testnet/api/"; }
			let resp = await fetch(url+"address/"+data);
			try{ resp=await resp.json(); }catch{ return Promise.reject({message:"JSON parse error"}); }	
			if(resp.error){ return Promise.reject({message:resp.error}); } resp.n_tx=resp.chain_stats.tx_count;
			resp.received = resp.chain_stats.funded_txo_sum;  if(resp.received>0){ resp.received=Number(resp.received/100000000).toFixed(8); }
			resp.balance = resp.chain_stats.funded_txo_sum-resp.chain_stats.spent_txo_sum; 
			if(resp.balance>0){ resp.balance=Number(resp.balance/100000000).toFixed(8); } return resp; }
		if(options.syte=="blockcypher.com")
		{	url = "https://api.blockcypher.com/v1/btc/main/"; if(options.testnet){ url = "https://api.blockcypher.com/v1/btc/test3/"; }
			let resp = await fetch(url+"addrs/"+data+"/balance");
			try{ resp=await resp.json(); }catch{ return Promise.reject({message:"JSON parse error"}); }	
			if(resp.error){ return Promise.reject({message:resp.error}); }
			resp.received = resp.total_received;  if(resp.received>0){ resp.received=Number(resp.received/100000000).toFixed(8); }
			resp.balance = resp.final_balance; if(resp.balance>0){ resp.balance=Number(resp.balance/100000000).toFixed(8); }
			return resp; }
	}
	return Promise.reject({message: "Неверные агрументы функции"});
	// https://blockchain.info/unspent?active=$address
}

function genhex(length=64)
{	let letters = "1234567890abcdef";
    let res=""; for (var i=0;i<length;i++) {res+=letters[randomInteger(0, letters.length-1)]; } return res; }
module.exports.genhex = genhex;
function randomInteger(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function randInt4b(min, max)
{ let numb = crypto.randomBytes(4).readUIntBE(0, 4); return Math.floor(numb/(4294967295/(max-min+1)))+min; }