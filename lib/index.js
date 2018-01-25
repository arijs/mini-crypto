/* eslint no-console:1 */
import rawCripto from './raw';
import getSum from './getsum';
import getSalt from './getsalt';
import charOffset from './charoffset';
import codePointIterator from './code-point-iterator';
import shuffle from './shuffle';

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
	if ('string' === typeof list) {
		list = charOffset.stringToList(list);
	}
	var len = list.length;
	if ( len < 16 && !params.unsafe ) {
		throw new Error('List too short: '+len+' <<'+list+'>>');
	}
	params.list = list;
	if ( !params.count ) {
		params.count = 64;
	}
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

function getSeedOffset(seed, offset, params) {
	var seedOffset = [];
	var slen = seed.length;
	var olen = offset.length;
	for ( var i = 0; i < slen; i++ ) {
		var n = seed.charCodeAt(i);
		var x = n + (slen - i);
		var so = getOffset(n + offset[x % olen], params);
		seedOffset = seedOffset.concat(so);
	}
	return seedOffset;
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
	var seedOffset = getSeedOffset(seed, offset, params);
	var salt = getSalt(list);
	var chOffset = charOffset.getOffset(seed, sum, seedOffset, list);
	return ({
		sum: sum,
		offset: offset,
		seedOffset: seedOffset,
		chOffset: chOffset,
		verify: verifyOffset(offset, chOffset),
		charOffset: charOffset.charOffset(chOffset, list),
		cripto: rawCripto.customOffset(list, chOffset),
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
				return encodeSources(sources, str);
			}
		, decode: function(seed, str) {
				var sources = getSources(seed, params);
				return decodeSources(sources, str);
			}
		, encodeSources: encodeSources
		, decodeSources: decodeSources
		, randstr: function(len) {
				// console.log('randstr '+len, params.list);
				return getSalt.randstr(len, params.list);
			}
		});
	function encodeSources(sources, str) {
		var sum = sources.sum;
		var saltLen = params.salt || 0;
		str = sources.charOffset.encode(str);
		str = conv(+getFactor(sum), str, sources.cripto);
		if (saltLen) {
			str = salt(sources.salt.salt, sum, str, saltLen);
		}
		str = shuffle.shuffle(str, sources.seedOffset);
		return str;
	}
	function decodeSources(sources, str) {
		var sum = sources.sum;
		var saltLen = params.salt || 0;
		str = shuffle.deshuffle(str, sources.seedOffset);
		if (saltLen) {
			str = salt(sources.salt.desalt, sum, str, saltLen);
		}
		str = conv(-getFactor(sum), str, sources.cripto)
		str = sources.charOffset.decode(str);
		return str;
	}
}

var cripto = getCripto();
cripto.custom = getCripto;
cripto.raw = rawCripto;
cripto.charOffset = charOffset;
cripto.codePointIterator = codePointIterator;
cripto.shuffle = shuffle;

export default cripto;
