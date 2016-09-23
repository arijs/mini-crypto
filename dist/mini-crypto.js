'use strict';

function verifyList(list) {
	var map = {}, c;
	for ( var i = 0, ii = list.length; i < ii; i++ ) {
		c = list.charAt(i);
		if ( c in map ) throw new Error('Repeated character: "'+c+'"');
		map[c] = true;
	}
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
		, list: ''
		, offset: 32
		, scheme: null
		};

defaults.list = (function(c) {
	// The sum of all these chars is 144
	return verifyList(
		''.concat(
			c.letterup,
			c.letterdown,
			c.accentup,
			c.accentdown,
			c.numbers,
			c.punct1,
			c.punct2));
})(defaults.chars);

defaults.all = (function(c) {
	// The sum of all these chars is 176
	return verifyList(
		''.concat(
			c.letterup,
			c.letterdown,
			c.accentup,
			c.accentdown,
			c.numbers,
			c.punct1,
			c.punct2,
			c.punct3));
})(defaults.chars);

function getScheme(offset, list) {
	var emap = {}
		, dmap = {}
		, i = 0
		, olen, av, al, j, b, c, o;

	offset || (offset = defaults.offset);
	list || (list = defaults.list);
	if ( !offset instanceof Array ) offset = [offset];
	olen = offset.length;
	av = list;
	al = av.length;

	while ( al ) {
		o = offset[i%olen] || 0;
		j = (i + o) % al;
		j < 1 && al > 1 && (j = (1 + al) * 0.5 |0);
		c = av.substr(j, 1);
		av = av.substr(0, j)+av.substr(j+1);
		b = list[i];
		//console.log(i, j, list[i], c);
		emap[b] = c;
		dmap[c] = b;
		al = av.length;
		i++;
	}

	return (
		{ offset: offset
		, list: list
		, encode: emap
		, decode: dmap
		});
}

defaults.scheme = getScheme();

function convert(str, map) {
	if ( str == null ) throw new Error('No string to convert');
	var conv = '', c;
	for ( var i = 0, ii = str.length; i < ii; i++ ) {
		c = str.charAt(i);
		c = c in map ? map[c] : c;
		conv += c;
	}
	return conv;
}

function custom(offset, list) {
	var scheme = (offset || list)
			? getScheme(offset, list)
			: defaults.scheme;
	return (
		{ scheme: scheme
		, encode: function(str) {
				return convert(str, scheme.encode);
			}
		, decode: function(str) {
				return convert(str, scheme.decode);
			}
		});
}

var cripto$1 = custom();
cripto$1.defaults = defaults;
cripto$1.custom = custom;

function getSum(str, params) {
	var slen = str && str.length || 0;
	var mod = params.mod;
	var sum, n;
	if ( slen < 16 ) throw new Error('Seed too short: '+slen+' ('+str+')');
	sum = params.start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		sum += (slen + n) * ((sum % 1024) + 1) * ((i % 64) + 1);
		sum %= mod;
	}
	return sum;
}

function randstr(len, charlist) {
	var clen = charlist.length
		, rand = '';
	for ( var i = 0; i < len; i++ ) {
		rand += clen && charlist.charAt((Math.random()*clen)%clen) || ' ';
	}
	return rand;
}

function getSalt(charlist) {
	return (
		{ salt: function(str, pre, post) {
				pre = randstr(pre, charlist);
				post = randstr(post, charlist);
				return pre+str+post;
			}
		, desalt: function(str, pre, post) {
				return str.substr(pre, str.length-pre-post);
			}
		});
}

getSalt.randstr = randstr;

function charOffset(offset, list) {
	offset = [].concat(offset || []);
	offset[0] || (offset[0] = 1);
	var index = getIndex(list)
		, invert = invOffset(offset);
	return (
		{ encode: function(str) {
				return convert$1(str, list, index, offset);
			}
		, decode: function(str) {
				return convert$1(str, list, index, invert);
			}
		});
}

function invOffset(offset) {
	var inv = [];
	for ( var i = 0, ii = offset.length; i < ii; i++ ) {
		inv[i] = -offset[i];
	}
	return inv;
}

function getIndex(list) {
	var index = {}
		, i = 0
		, count = list.length;
	for ( i = 0; i < count; i++ ) {
		index[list[i]] = i;
	}
	return index;
}

function convert$1(str, list, index, offset) {
	var len = list.length
		, olen = offset.length
		, slen = str.length
		, after = ''
		, pos = 0;
	for ( var i = 0; i < slen; i++ ) {
		var o = offset[i%olen]
			, c = str[i];
		o = ((o % len) + len) % len;
		pos += o;
		pos %= len;
		if ( c in index ) {
			c = list[ (index[c] + pos) % len ];
		}
		after += c;
	}
	return after;
}

function getOffset$1(seed, sum, offset, list) {
	var olen = offset.length
		, slen = seed.length
		, chOffset = []
		, total = 0
		, current;
	list = list.length;
	for ( var i = 0; i < slen; i++ ) {
		current = (seed.charCodeAt(i) + i) * sum + i;
		total += current + (offset[(current+i)%olen] || 0);
		//,total %= list;
		chOffset[i] = total % list;
	}
	return chOffset;
}

function charSeed(seed, sum, offset, list) {
	var chOffset = getOffset$1(seed, sum, offset, list);
	return charOffset(chOffset, list);
}

var obj =
		{ offset: charOffset
		, seed: charSeed
		, getOffset: getOffset$1
		};

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
	var chOffset = obj.getOffset(seed, sum, offset, list);
	return ({
		sum: sum,
		offset: offset,
		chOffset: chOffset,
		verify: verifyOffset(offset, chOffset),
		charOffset: obj.offset(chOffset, list),
		cripto: cripto$1.custom(chOffset, list),
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
cripto.raw = cripto$1;

module.exports = cripto;