
import codePointIterator from './code-point-iterator';

function charOffset(list, offset) {
	offset = [].concat(offset || []);
	offset[0] || (offset[0] = 1);
	var index = getIndex(list);
	var invert = invOffset(offset);
	list = codePointIterator(list, 0).toArray();
	return (
		{ encode: function(str) {
				return convert(str, list, index, offset);
			}
		, decode: function(str) {
				return convert(str, list, index, invert);
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
	var index = {};
	var i = 0;
	var count = list.length;
	var iter = codePointIterator(list, 0);
	iter.forEach(1, function(c) {
		index[c] = i++;
	});
	return index;
}

function convert(str, list, index, offset) {
	var len = list.length;
	var olen = offset.length;
	var slen = str.length;
	var after = '';
	var pos = 0;
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
	});
	return after;
}

function getOffset(seed, sum, offset, listLength) {
	var olen = offset.length;
	var chOffset = [];
	var total = 0;
	var current;
	var n;
	seed = codePointIterator(seed, 0).toCodePointArray();
	var slen = seed.length;
	for ( var i = 0; i < olen; i++ ) {
		n = seed[i % slen];
		current = (n + i) * sum + n + i;
		total += current + (offset[current%olen] || 0);
		total %= listLength;
		chOffset[i] = total;
	}
	return chOffset;
}

function charSeed(seed, sum, offset, list) {
	var chOffset = getOffset(seed, sum, offset, list);
	return charOffset(chOffset, list);
}

var obj =
		{ offset: charOffset
		, seed: charSeed
		, getOffset: getOffset
		};

export default obj;
