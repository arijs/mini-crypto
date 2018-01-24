
import codePointIterator from './code-point-iterator';

function verifyList(list) {
	var map = {}, c;
	var iter = codePointIterator(list, 0);
	var repeat;
	iter.forEach(1, function(c) {
		if ( c in map ) {
			repeat = c;
			return this._break;
		} else {
			map[c] = true;
		}
	});
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

function getSchemeOffset(list, offset) {
	offset || (offset = defaults.offset);
	if ( !(offset instanceof Array) ) offset = [offset];
	var olen = offset.length;
	return getScheme(list, function(i) {
		return i + (offset[i%olen] || 0);
	});
}
function getScheme(list, fn) {
	var emap = {};
	var dmap = {};
	var al = 0;
	var olen, j, b, c, o;

	offset || (offset = defaults.offset);
	list || (list = defaults.list);
	if ( !(offset instanceof Array) ) offset = [offset];
	olen = offset.length;
	var iter = codePointIterator(list, 0);
	var avSort = [];
	var avRand = [];

	iter.forEach(1, function(c) {
		avSort.push(c);
		avRand.splice(fn(al) % (al + 1), 0, c);
		al++;
	});
	for ( var i = 0; i < al; i++ ) {
		c = avSort[i];
		b = avRand[i];
		emap[b] = c;
		dmap[c] = b;
	}

	return (
		{ offset: offset
		, list: list
		, encode: emap
		, decode: dmap
		});
}

defaults.scheme = getSchemeOffset();

function convert(str, map) {
	if ( !str ) return str;
	var conv = '', c;
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
	var scheme = getScheme(list, fn);
	return getSchemeObject(scheme);
}

var cripto = customOffset();
cripto.defaults = defaults;
cripto.customOffset = customOffset;
cripto.customFn = customFn;

export default cripto;
