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

var inv256 = 1/1048576;
var factor = 655361*inv256;
function getSeed(str, mod, start) {
	var c, n, slen = str && str.length || 0;
	if ( slen < 16 ) throw new Error('Seed too short: '+slen+' ('+str+')');
	mod = +mod|0 || (1024 * 1024 * 1024);
	start = (+start|0) % mod || (mod*factor)|0;
	c = start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		c += (n % mod) * (((c % 32) * i + 1) % 32);
		c %= mod;
	}
	return (
		{ seed: c
		, mod: mod
		, start: start
		});
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

function charOffset(list, offset) {
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

function seedToOffset(seed, sum, list) {
	var offset = []
		, total = 0
		, current;
	list = list.length;
	for ( var i = 0, ii = seed.length; i < ii; i++ ) {
		current = seed.charCodeAt(i) + ((i * sum + i) % list);
		total += current;
		total %= list;
		offset[i] = total;
	}
	return offset;
}

function charSeed(seed, sum, list) {
	var offset = seedToOffset(seed, sum, list);
	return charOffset(list, offset);
}

var obj =
		{ offset: charOffset
		, seed: charSeed
		};

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
	return params && (params.list || cripto$1.scheme.list);
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
		, cripto = cripto$1.custom(offset, list)
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

function choffset(seed, sum, obj$$) {
	var list = obj$$.cripto.scheme.list;
	return obj.seed(seed, sum, list);
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
cripto.raw = cripto$1;

module.exports = cripto;