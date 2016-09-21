import rawCripto from './raw';
import getSeed from './getseed';
import getSalt from './getsalt';
import charOffset from './charoffset';

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

function getOffset(seed, mod, start, list) {
	var len = list.length
		, min = 8
		, count = 4
		, done = 0
		, remain = len - min
		, seedPi = seed * Math.PI * mod * 10
		, off = [];
	while ( done < count ) {
		off[done] = (seed + (done * seedPi |0)) % remain + min
		done++;
	}
	return off;
}

function getParamsCharlist(params) {
	return params && (params.list || rawCripto.scheme.list);
}

function getRawCripto(seed, params) {
	params || (params = {});
	var mod = params.mod
		, start = params.start
		, list = getParamsCharlist(params);
	var len = list.length
	if ( len < 16 ) throw new Error('List too short: '+len+' <<'+list+'>>');
	var sum = getSeed(seed, mod, start);
	seed = sum.seed;
	params.mod = mod = sum.mod;
	params.start = start = sum.start;
	var offset = getOffset(seed, mod, start, list)
		, cripto = rawCripto.custom(offset, list)
		, salt = getSalt(list);
	return (
		{ seed: seed
		, cripto: cripto
		, salt: salt
		});
}

function salt(fn, count, str, length) {
	var pre = getSaltLengthPre(count, length)
		, post = getSaltLengthPost(count, length);
	return fn(str, pre, post);
}

function choffset(seed, sum, obj) {
	var list = obj.cripto.scheme.list;
	return charOffset.seed(seed, sum, list);
}

function getCripto(params) {
	params || (params = {});
	return (
		{ params: params
		, encode: function(seed, str) {
				var obj = getRawCripto(seed, params)
					, sum = obj.seed
					, saltLen = params.salt || 0;
				str = choffset(seed, sum, obj).encode(str);
				str = conv(+getFactor(sum), str, obj.cripto);
				if (saltLen) {
					str = salt(obj.salt.salt, sum, str, saltLen);
				}
				return str;
			}
		, decode: function(seed, str) {
				var obj = getRawCripto(seed, params)
					, sum = obj.seed
					, saltLen = params.salt || 0;
				if (saltLen) {
					str = salt(obj.salt.desalt, sum, str, saltLen);
				}
				str = conv(-getFactor(sum), str, obj.cripto)
				str = choffset(seed, sum, obj).decode(str);
				return str;
			}
		, randstr: function(len) {
				return getSalt.randstr(len, getParamsCharlist(params));
			}
		});
}

var cripto = getCripto();
cripto.custom = getCripto;
cripto.raw = rawCripto;

export default cripto;
