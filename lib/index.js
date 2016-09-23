import rawCripto from './raw';
import getSum from './getsum';
import getSalt from './getsalt';
import charOffset from './charoffset';

function initParams(params) {
	var mod = params.mod;
	if ( !mod ) {
		mod = 1024 * 1024 * 1024;
	}
	params.mod = mod;
	var start = params.start;
	if ( !start ) {
		start = parseInt(mod * (655361/1048576));
	}
	params.start = start % mod;
	var list = params.list;
	if ( !list ) {
		list = rawCripto.scheme.list;
	}
	var len = list.length;
	if ( len < 16 ) {
		throw new Error('List too short: '+len+' <<'+list+'>>');
	}
	params.list = list;
	var count = params.count;
	if ( !count ) {
		count = 64;
	}
	params.count = count;
}

function getFactor(c) {
	c = ((c % 4) + 4) % 4;
	c -= c > 1 ? 1 : 2;
	return c;
}

function conv(n, str, cripto) {
	n = +n|0; // parseInt
	if ( n > 8 || n < -8 ) throw new Error('Invalid factor: '+n);
	while ( n > 0 ) {
		str = cripto.encode(str);
		n--;
	}
	while ( n < 0 ) {
		str = cripto.decode(str);
		n++;
	}
	return str;
}

function getSaltLengthPre(sum, length) {
	return (sum % length);
}

function getSaltLengthPost(sum, length) {
	return (length - (sum % length));
}

function getOffset(sum, params) {
	var mod = params.mod;
	var start = params.start;
	var count = params.count;
	var done = 0
		, seedPi = parseInt((sum + start) * Math.PI * 1024 + count)
		, off = [];
	while ( done < count ) {
		var current = ((done % 64) + 1) * seedPi;
		current = (sum + start + current) % mod;
		off[done] = current;
		done++;
	}
	return off;
}

function salt(fn, count, str, length) {
	var pre = getSaltLengthPre(count, length)
		, post = getSaltLengthPost(count, length);
	return fn(str, pre, post);
}

function verifyOffset(list1, list2) {
	var min = Math.min(list1.length, list2.length);
	var max = Math.max(list1.length, list2.length);
	var diff = max-min;
	for ( var i = 0; i < min; i++ ) {
		diff += (list1[i] !== list2[i]) ? 1 : 0;
	}
	return diff;
}

function getSources(seed, params) {
	var list = params.list;
	var sum = getSum(seed, params);
	var offset = getOffset(sum, params);
	var salt = getSalt(list);
	var chOffset = charOffset.getOffset(seed, sum, offset, list);
	return ({
		sum: sum,
		offset: offset,
		chOffset: chOffset,
		verify: verifyOffset(offset, chOffset),
		charOffset: charOffset.offset(chOffset, list),
		cripto: rawCripto.custom(chOffset, list),
		salt: salt
	});
}

function getCripto(params) {
	params || (params = {});
	initParams(params);
	return (
		{ params: params
		, sources: function(seed) {
				return getSources(seed, params);
			}
		, encode: function(seed, str) {
				var sources = getSources(seed, params);
				var sum = sources.sum;
				var saltLen = params.salt || 0;
				str = sources.charOffset.encode(str);
				str = conv(+getFactor(sum), str, sources.cripto);
				if (saltLen) {
					str = salt(sources.salt.salt, sum, str, saltLen);
				}
				return str;
			}
		, decode: function(seed, str) {
				var sources = getSources(seed, params);
				var sum = sources.sum;
				var saltLen = params.salt || 0;
				if (saltLen) {
					str = salt(sources.salt.desalt, sum, str, saltLen);
				}
				str = conv(-getFactor(sum), str, sources.cripto)
				str = sources.charOffset.decode(str);
				return str;
			}
		, randstr: function(len) {
				return getSalt.randstr(len, params.list);
			}
		});
}

var cripto = getCripto();
cripto.custom = getCripto;
cripto.raw = rawCripto;

export default cripto;
