var cripto = require('../dist/mini-crypto');

function show(cripto, title) {

console.log('-------- '+title+' --------');

var str = 'secret sssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss'
	, seed1 = '9876543210fedcba' // must be at least 16 characters
	//, seed2 = 'fedcba9876543210' // incompatible example
	, seed2 = cripto.randstr(16)
	, encoded1 = cripto.encode(seed1, str)
	, encoded2 = cripto.encode(seed2, str)
	, decoded11 = cripto.decode(seed1, encoded1)
	, decoded12 = cripto.decode(seed1, encoded2)
	, decoded21 = cripto.decode(seed2, encoded1)
	, decoded22 = cripto.decode(seed2, encoded2)
	, encoded12 = cripto.encode(seed1, decoded12)
	, recoded12 = cripto.decode(seed2, encoded12)
	, encoded21 = cripto.encode(seed2, decoded21)
	, recoded21 = cripto.decode(seed1, encoded21);

console.log('Encoded 1 ('+encoded1+'): '+seed1);
console.log('Encoded 2 ('+encoded2+'): '+seed2);

console.log('Decoded 1-1: '+decoded11);
console.log('Decoded 1-2: '+decoded12);
console.log('Decoded 2-1: '+decoded21);
console.log('Decoded 2-2: '+decoded22);
console.log('Encoded 1-2: '+encoded12);
console.log('Recoded 1-2: '+recoded12);
console.log('Encoded 2-1: '+encoded21);
console.log('Recoded 2-1: '+recoded12);

}

show(cripto, 'Default');

show(cripto.custom({ mod: 256, start: 1, salt: 32 }), 'Custom 1');

show(cripto.custom({ mod: 65536, start: 53572 }), 'Custom 2');
