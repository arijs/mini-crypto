/* eslint no-console:1 */
import codePointIterator from './code-point-iterator';

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

var cripto = customOffset();
cripto.defaults = defaults;
cripto.customOffset = customOffset;
cripto.customFn = customFn;

export default cripto;
