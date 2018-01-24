var cripto = require('../dist/mini-crypto');
var shuffle = cripto.shuffle;

function show(cripto, title) {

console.log('-------- '+title+' --------');

var str = 'secret sssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss'
	, seed1 = '9876543210fedcba' // must be at least 16 characters
	//, seed2 = 'fedcba9876543210' // incompatible example
	, seed2 = cripto.randstr(16)
	, encoded1 = cripto.encode(seed1, str)
	, sources1 = cripto.sources(seed1)
	, encoded2 = cripto.encode(seed2, str)
	, sources2 = cripto.sources(seed2)
	, decoded11 = cripto.decode(seed1, encoded1)
	// , decoded12 = cripto.decode(seed1, encoded2)
	// , decoded21 = cripto.decode(seed2, encoded1)
	, decoded22 = cripto.decode(seed2, encoded2)
	// , encoded12 = cripto.encode(seed1, decoded12)
	// , recoded12 = cripto.decode(seed2, encoded12)
	// , encoded21 = cripto.encode(seed2, decoded21)
	// , recoded21 = cripto.decode(seed1, encoded21);
	, shuffled = shuffle.shuffle(str, sources1.seedOffset)
	, deshuffl = shuffle.deshuffle(shuffled, sources1.seedOffset);

console.log('Encoded 1 ('+encoded1+'): '+seed1);
/* @debug console.log('Sum '+sources1.sum+' '+
	sources1.verify+' ['+
	sources1.offset.slice(0, 4).join()+
	']('+sources1.offset.length+') ['+
	sources1.chOffset.slice(0, 4).join()+
	']('+sources1.chOffset.length+')'
);*/
console.log('Encoded 2 ('+encoded2+'): '+seed2);
/* @debug console.log('Sum '+sources2.sum+' '+
	sources2.verify+' ['+
	sources2.offset.slice(0, 4).join()+
	']('+sources2.offset.length+') ['+
	sources2.chOffset.slice(0, 4).join()+
	']('+sources2.chOffset.length+')'
);*/

console.log('Decoded 1-1: '+decoded11);
// console.log('Decoded 1-2: '+decoded12);
// console.log('Decoded 2-1: '+decoded21);
console.log('Decoded 2-2: '+decoded22);
console.log('Shuffled: '+shuffled);
console.log('Deshuffl: '+deshuffl);
// console.log('Encoded 1-2: '+encoded12);
// console.log('Recoded 1-2: '+recoded12);
// console.log('Encoded 2-1: '+encoded21);
// console.log('Recoded 2-1: '+recoded12);


}

show(cripto, 'Default');

show(cripto.custom({ mod: 256, start: 1, salt: 32 }), 'Custom 1');

show(cripto.custom({ mod: 65536, start: 53572 }), 'Custom 2');
