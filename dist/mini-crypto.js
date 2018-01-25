'use strict';

function isSurrogateHigh(n) {
	return 0xd800 <= n && n <= 0xdbff;
}
function isSurrogateLow(n) {
	return 0xdc00 <= n && n <= 0xdfff;
}

function codePointIterator(str, i) {
	var slen = str.length;
	var pos;
	setPos(i);
	// _break and ctx for use in forEach()
	var _break = {};
	var ctx = {
		_break: _break
	};
	return {
		setPos: setPos,
		hasPos: hasPos,
		isFirst: isFirst,
		isLast: isLast,
		codePoint: codePoint,
		current: current,
		move: move,
		forEach: forEach,
		toArray: toArray,
		toCodePointArray: toCodePointArray
	};
	function setPos(i) {
		i = +i ? (i > 0 ? i : slen - i) : 0;
		tryPos(i);
		pos = correctPos(i);
	}
	function hasPos(pos) {
		return 0 <= pos && pos < slen;
	}
	function isFirst() {
		return pos[0] == 0;
	}
	function isLast() {
		return (pos[0] + pos[1]) == slen;
	}
	function tryPos(pos) {
		if (!hasPos(pos)) {
			throw new Error('Out of bounds: pos '+pos+' of string with length '+slen);
		}
	}
	function correctPos(p) {
		var clen = 1;
		if (isSurrogateLow(str.charCodeAt(p))) {
			clen = 2;
			p--;
		}
		if (isSurrogateHigh(str.charCodeAt(p))) {
			clen = 2;
		}
		return [p, clen];
	}
	function codePoint() {
		var first = str.charCodeAt(pos[0]);
		var second = pos[1] == 2 ? str.charCodeAt(pos[0]+1) : 0;
		if (isSurrogateHigh(first) && isSurrogateLow(second)) {
			return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
		}
		return first;
	}
	function move(walk) {
		var step = (walk == 0) ? 0 : (walk > 0 ? 1 : -1);
		while (walk) {
			var p = pos[0];
			walk -= step;
			p += (step == 1 && pos[1] == 2) ? 2 : step;
			tryPos(p);
			pos = correctPos(p);
		}
	}
	function current() {
		var p = pos[0];
		var l = pos[1];
		return {
			index: p,
			length: l,
			chr: str.substr(p, l)
		};
	}
	function forEach(mv, fn) {
		if (!mv) throw new Error('Invalid CodePointIterator forEach move '+mv);
		for(;;) {
			var p = pos[0];
			var l = pos[1];
			var c = str.substr(p, l);
			var ret = fn.call(ctx, c, p, l);
			var isEnd = mv > 0 ? isLast() : isFirst();
			if ( isEnd || ret === _break ) {
				break;
			} else {
				move(mv);
			}
		}
	}
	function toArray() {
		var list = [];
		forEach(1, function(c) {
			list.push(c);
		});
		return list;
	}
	function toCodePointArray() {
		var list = [];
		forEach(1, function() {
			list.push(codePoint());
		});
		return list;
	}
}

codePointIterator.isSurrogateHigh = isSurrogateHigh;
codePointIterator.isSurrogateLow = isSurrogateLow;

/* eslint no-console:1 */
function stringToList(str) {
	return codePointIterator(str, 0).toArray();
}

function verifyList(list) {
	var map = {}, c;
	var repeat;
	for ( var i = 0, ii = list.length; i < ii; i++ ) {
		if ( c in map ) {
			repeat = c;
			break;
		} else {
			map[c] = true;
		}
	}
	if (repeat) throw new Error('Repeated character: "'+repeat+'"');
	return list;
}

var defaults =
		{ chars:
			{ letterup: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			, letterdown: 'abcdefghijklmnopqrstuvwxyz'
			, accentup: 'ÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ'
			, accentdown: 'àáâãäèéêëìíîïòóôõöùúûüçñ'
			, numbers: '0123456789'
			, punct1: '.,:;*+-/<=>()[]{} '
			, punct2: '!"#$%&\'?@\\^|~_`´'
			, punct3: '¡¢£¤¥¦§¨©ª«¬­®¯°±²³µ¶·¹º»¼½¾¿×÷ '
			}
		, list: null
		, offset: 32
		, scheme: null
		};

defaults.list = (function(c) {
	// The sum of all these chars is 144
	return verifyList(stringToList(''.concat(
		c.letterup,
		c.letterdown,
		c.accentup,
		c.accentdown,
		c.numbers,
		c.punct1,
		c.punct2
	)));
})(defaults.chars);

defaults.all = (function(c) {
	// The sum of all these chars is 176
	return verifyList(stringToList(''.concat(
		c.letterup,
		c.letterdown,
		c.accentup,
		c.accentdown,
		c.numbers,
		c.punct1,
		c.punct2,
		c.punct3
	)));
})(defaults.chars);

function getSchemeOffset(list, offset) {
	offset || (offset = defaults.offset);
	if ( !(offset instanceof Array) ) offset = [offset];
	var olen = offset.length;
	var fn = function(i) {
		return i + (offset[i%olen] || 0);
	};
	fn.offset = offset;
	return getSchemeFn(list, fn);
}

function getSchemeFn(list, fn) {
	var emap = {};
	var dmap = {};
	var al = 0;
	var len, b, c;

	list || (list = defaults.list);
	len = list.length;
	var avSort = [];
	var avRand = [];

	for ( al = 0; al < len; al++ ) {
		avSort.push(c);
		avRand.splice(fn(al) % (al + 1), 0, c);
	}
	for ( al = 0; al < len; al++ ) {
		c = avSort[al];
		b = avRand[al];
		emap[b] = c;
		dmap[c] = b;
	}

	return {
		offset: fn.offset,
		list: list,
		encode: emap,
		decode: dmap
	};
}

defaults.scheme = getSchemeOffset();

function convert(str, map) {
	if ( !str ) return str;
	var conv = '';
	var iter = codePointIterator(str, 0);
	iter.forEach(1, function(c) {
		conv += c in map ? map[c] : c;
	});
	return conv;
}

function getSchemeObject(scheme) {
	return {
		scheme: scheme,
		encode: function(str) {
			return convert(str, scheme.encode);
		},
		decode: function(str) {
			return convert(str, scheme.decode);
		}
	};
}

function customOffset(list, offset) {
	var scheme = (list || offset)
		? getSchemeOffset(list, offset)
		: defaults.scheme;
	return getSchemeObject(scheme);
}

function customFn(list, fn) {
	var scheme = getSchemeFn(list, fn);
	return getSchemeObject(scheme);
}

var cripto$1 = customOffset();
cripto$1.defaults = defaults;
cripto$1.customOffset = customOffset;
cripto$1.customFn = customFn;

function getSum(str, params, calcFn) {
	var slen = str && str.length || 0;
	var mod = params.mod;
	var sum, n;
	if (!calcFn) calcFn = calcSumDefault;
	if ( slen < 16 && !params.unsafe ) throw new Error('Seed too short: '+slen+' ('+str+')');
	sum = params.start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		sum = calcFn(slen, i, n, sum, mod);
	}
	return sum;
}

function calcSumDefault(stringLength, charIndex, charCode, currentSum, modulo) {
	currentSum += (stringLength + charCode) *
		((currentSum % 1024) + 1) *
		((charIndex % 64) + 1) +
		charCode + (stringLength - charIndex) + 1;
	currentSum %= modulo;
	return currentSum;
}

/* eslint no-console:1 */

function randstr(len, charlist) {
	var clen = charlist.length;
	var rand = '';
	for ( var i = 0; i < len; i++ ) {
		var ci = (Math.random()*clen)%clen|0;
		rand += (clen && charlist[ci]) || ' ';
	}
	return rand;
}

function getSalt(charlist) {
	return {
		salt: function(str, pre, post) {
			pre = randstr(pre, charlist);
			post = randstr(post, charlist);
			return pre+str+post;
		},
		desalt: function(str, pre, post) {
			str = codePointIterator(str, 0).toArray();
			str = str.slice(pre, str.length - post);
			str = str.join('');
			return str;
		}
	};
}

getSalt.randstr = randstr;

function stringToList$1(str) {
	return codePointIterator(str, 0).toArray();
}

function invOffset(offset) {
	var inv = [];
	for ( var i = 0, ii = offset.length; i < ii; i++ ) {
		inv[i] = -offset[i];
	}
	return inv;
}

function getIndex(list) {
	var index = {};
	for ( var i = 0, ii = list.length; i < ii; i++ ) {
		index[list[i]] = i;
	}
	return index;
}

function convert$1(str, list, index, offset) {
	var len = list.length;
	var olen = offset.length;
	var after = '';
	var pos = 0, i = 0;
	var iter = codePointIterator(str, 0);
	iter.forEach(1, function(c) {
		var o = offset[i%olen];
		o = ((o % len) + len) % len;
		pos += o;
		pos %= len;
		if ( c in index ) {
			c = list[ (index[c] + pos) % len ];
		}
		after += c;
		i++;
	});
	return after;
}

function charOffset(offset, list) {
	offset = [].concat(offset || []);
	offset[0] || (offset[0] = 1);
	var index = getIndex(list);
	var invert = invOffset(offset);
	return {
		encode: function(str) {
			return convert$1(str, list, index, offset);
		},
		decode: function(str) {
			return convert$1(str, list, index, invert);
		}
	};
}

function charOffsetString(offset, list) {
	return charOffset(offset, stringToList$1(list));
}

function getOffset$1(seed, sum, offset, list) {
	var chOffset = [];
	var total = 0;
	var current;
	var n;
	seed = codePointIterator(seed, 0).toCodePointArray();
	var slen = seed.length;
	var olen = offset.length;
	var len = list.length;
	for ( var i = 0; i < olen; i++ ) {
		n = seed[i % slen];
		current = (n + i) * sum + n + i;
		total += current + (offset[current%olen] || 0);
		total %= len;
		chOffset[i] = total;
	}
	return chOffset;
}

function getOffsetString(seed, sum, offset, list) {
	return getOffset$1(seed, sum, offset, stringToList$1(list));
}

function charSeed(seed, sum, offset, list) {
	var chOffset = getOffset$1(seed, sum, offset, list);
	return charOffset(chOffset, list);
}

function charSeedString(seed, sum, offset, list) {
	return charSeed(seed, sum, offset, stringToList$1(list));
}

var obj = {
	stringToList: stringToList$1,
	charOffset: charOffset,
	charOffsetString: charOffsetString,
	getOffset: getOffset$1,
	getOffsetString: getOffsetString,
	charSeed: charSeed,
	charSeedString: charSeedString
};

var obj$1 = {
	getExchanges: getExchanges,
	shuffleExChars: shuffleExChars,
	deshuffleExChars: deshuffleExChars,
	shuffle: shuffle,
	deshuffle: deshuffle
};

function getExchanges(iter, offset) {
	var count = 0;
	var result = [];
	var chars = [];
	var olen = offset.length;
	iter.setPos(0);
	for (;;) {
		var c = iter.current();
		var on = offset[count % olen];
		count++;
		result.push(on);
		chars.push(c.chr);
		if (iter.isLast()) {
			break;
		} else {
			iter.move(1);
		}
	}
	return {
		count: count,
		result: result,
		chars: chars
	};
}

function shuffle(str, offset) {
	if (!str.length) return str;
	var ex = getExchanges(codePointIterator(str, 0), offset);
	return shuffleExChars(ex.count, ex.result, ex.chars);
}

function shuffleExChars(count, result, chars) {
	for ( var i = 0; i < count; i++ ) {
		var ri = result[i] % count;
		var tmp = chars[i];
		chars[i] = chars[ri];
		chars[ri] = tmp;
	}
	return chars.join('');
}

function deshuffle(str, offset) {
	if (!str.length) return str;
	var ex = getExchanges(codePointIterator(str, 0), offset);
	return deshuffleExChars(ex.count, ex.result, ex.chars);
}

function deshuffleExChars(count, result, chars) {
	for ( var i = count-1; i >= 0; i-- ) {
		var ri = result[i] % count;
		var tmp = chars[i];
		chars[i] = chars[ri];
		chars[ri] = tmp;
	}
	return chars.join('');
}

/* eslint no-console:1 */
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
		list = cripto$1.scheme.list;
	}
	if ('string' === typeof list) {
		list = obj.stringToList(list);
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
	var chOffset = obj.getOffset(seed, sum, seedOffset, list);
	return ({
		sum: sum,
		offset: offset,
		seedOffset: seedOffset,
		chOffset: chOffset,
		verify: verifyOffset(offset, chOffset),
		charOffset: obj.charOffset(chOffset, list),
		cripto: cripto$1.customOffset(list, chOffset),
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
		str = obj$1.shuffle(str, sources.seedOffset);
		return str;
	}
	function decodeSources(sources, str) {
		var sum = sources.sum;
		var saltLen = params.salt || 0;
		str = obj$1.deshuffle(str, sources.seedOffset);
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
cripto.raw = cripto$1;
cripto.charOffset = obj;
cripto.codePointIterator = codePointIterator;
cripto.shuffle = obj$1;

module.exports = cripto;