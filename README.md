A mini bitcoin libary / Мини биткоин библиотека.

На данный момент библиотека способна выполнять лишь простые переобразования и генерацию ключей, а также запросы к обозревателям блоков.

## Пример
```js
let blib = require('./node-modules/btc-minilib/btc-minilib.js');
let wifprefix = "80"; // Префикс генерации WIF ключей для BTC Mainnet
let p2pkh_pefix = "00"; // Префикс вычисления p2pkh адресов для BTC Mainnet

(async function(){
	let privkey = blib.genPrivateKey(); // генерация 32-битного закрытого ключа в виде строки HEX.
	console.log("Приватный ключ:", privkey); // "Приватный ключ: 0000000000000000000000000000000000000000000000000000000000000001"
	// Переобразование необработанного закрытого HEX ключа в WIF форматы(Для BTC Mainnet используется префикс "80"):
	console.log("Hex->WIF(51):", blib.wif.encode(privkey, 51, wifprefix)); // Несжатый WIF длинной 51 символ.
	console.log("Hex->Compressed WIF(52):", blib.wif.encode(privkey, 52, wifprefix)); // Сжатый WIF длинной 52 символа.
	console.log("Hex->Base64(44):", Buffer.from(privkey, "hex").toString("base64")); // Формат Base64 44 символа
	// Вычисление публичных адресов из необработанного закрытого HEX ключа(в скобках указана длинна адреса в символах):
	console.log("= Публичные адреса =");
	console.log("Несжатый P2PKH(34):", blib.getaddress.p2pkh(privkey, false, p2pkh_pefix)); // "Pay to Public Key Hash", "legacy" адреса.
	console.log("Сжатый P2PKH(34):", blib.getaddress.p2pkh(privkey, true, p2pkh_pefix)); // те же "Pay to Public Key Hash" адреса, только используется сжатый открытый ключ.
	console.log("SegWit P2WPKH(42):", blib.getaddress.p2wpkh(privkey)); // "Pay to Witness Public Key Hash", также "Bech32"
	console.log("SegWit P2SH(34):", blib.getaddress.p2sh(privkey)); // "Pay to Script Hash" адреса.
})();
```
## Методы
#### **blib.genhex(length)** - сгенерировать случайный HEX ключ(быстро, но небезопасно), возвращает String.
Параметры: length(длинна HEX ключа, По умолчанию=64).
#### **blib.genPrivateKey()** - сгенерировать закрытый 32-битный HEX ключ(медленно, более безопасно), возвращает String.
#### **blib.getPublicKey(privKey, [iscompressed])** - получить публичный ключ из приватного, возвращает String.
Параметры: privKey(HEX, строка 64 символа), iscompressed(генерировать ли сжатый ключ, логический).
#### **blib.wif.encode(key, [length], [prefix])** - получить WIF формат ключа из закрытого HEX ключа, возвращает String.
Параметры: key(HEX, строка 64 символа), length(длинна wif ключа. По умолчанию=51, Возможные:51-52), prefix(HEX префикс получения WIF, По умолчанию="80").
#### **blib.wif.decode(key)** - получить WIF формат ключа из закрытого HEX ключа, возвращает String.
Параметры: key(Закрытый WIF ключ, строка 51-52 символа).
#### **blib.getaddress.p2pkh(privKey, [compressed], [prefix])** - получить публичный адрес P2PKH из закрытого HEX ключа, возвращает String.
Параметры: privKey(HEX, строка 64 символа), compressed(получить ли сжатую версию адреса, логический), prefix(HEX префикс получения адреса, По умолчанию="00").
#### **blib.getaddress.p2wpkh(privKey, prefix)** - получить публичный адрес P2WPKH(SegWit Bech32) из закрытого HEX ключа, возвращает String.
Параметры: privKey(HEX, строка 64 символа), prefix(HEX префикс получения адреса, По умолчанию="bc").
#### **blib.getaddress.p2sh(privKey)** - получить публичный адрес P2WPKH(SegWit Bech32) из закрытого HEX ключа, возвращает String.
Параметры: privKey(HEX, строка 64 символа), prefix(HEX префикс получения адреса, По умолчанию="05").
#### **blib.mnemonic.sha256(word)** - получить 32-битный закрытый HEX ключ из текстовой фразы(фраз), возвращает String.
#### **blib.mnemonic.gen(length, isfast)** - сгенерировать несколько текстовых фраз для мнемоники, возвращает String.
Параметры: length(кол-во сгенерированных фраз), isfast(использовать ли быстрый рандомайзер(небезопасно), логический).
#### **blib.request(type, data, options)** - отправить запрос одному из обозревателю блоков, возвращает Object.
Параметры: \
	- type: Тип данных, которые запрашиваются, доступные:\
	- - "address": Запросить информацию о публичном адресе.\
	- data: Данные запроса. Если type указан "address", в этом случае этот парамер является строкой с запрашиваемым публичным адресом.\
	- options: Объект с параметрами запроса:
```js
	{   syte: "blockchain.info", // Домен запроса. Поддерживаемые: "blockchain.info", "blockstream.info", "bitaps.com", "mempool.space", "blockcypher.com".
		testnet: false, // Делается ли запрос в тестовую сеть. Логический.
	}
```
Пример:
```js
let blib = require('./node-modules/btc-minilib/btc-minilib.js');
(async function(){ console.log(await blib.request("address", "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm")); })();
```
Ответ: 
```js
	{ hash160: '91b24bf9f5288532960ac687abb035127b1d28a5',
	  address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
	  n_tx: 1393,
	  n_unredeemed: 0,
	  total_received: 781874268,
	  total_sent: 781874268,
	  final_balance: 0,
	  txs: [],
	  received: '7.81874268',
	  balance: 0 }
```
## Префиксы
<small>WIF BTC Mainnet: "80"; WIF BTC Testnet: "ef";</small>\
<small>P2PKH BTC Mainnet: "00"; P2PKH BTC Testnet: "6f";</small>\
<small>P2WPKH BTC Mainnet: "bc"; P2WPKH BTC Testnet: "tb";</small>\
<small>P2SH BTC Mainnet: "05"; P2SH BTC Testnet: "c4";</small>

<small>WIF LTC Mainnet: "b0"; WIF LTC Testnet: "ef";</small>\
<small>P2PKH LTC Mainnet: "30"; P2PKH LTC Testnet: "6f";</small>\
<small>P2WPKH LTC Mainnet: "ltc"; P2WPKH LTC Testnet: "tltc";</small>\
<small>P2SH LTC Mainnet: "32"; P2SH BTC Testnet: "3a";</small>