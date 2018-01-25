
import codePointIterator from './code-point-iterator';

function stringToList(str) {
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

function convert(str, list, index, offset) {
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
			return convert(str, list, index, offset);
		},
		decode: function(str) {
			return convert(str, list, index, invert);
		}
	};
}

function charOffsetString(offset, list) {
	return charOffset(offset, stringToList(list));
}

function getOffset(seed, sum, offset, list) {
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
	return getOffset(seed, sum, offset, stringToList(list));
}

function charSeed(seed, sum, offset, list) {
	var chOffset = getOffset(seed, sum, offset, list);
	return charOffset(chOffset, list);
}

function charSeedString(seed, sum, offset, list) {
	return charSeed(seed, sum, offset, stringToList(list));
}

var obj = {
	stringToList: stringToList,
	charOffset: charOffset,
	charOffsetString: charOffsetString,
	getOffset: getOffset,
	getOffsetString: getOffsetString,
	charSeed: charSeed,
	charSeedString: charSeedString
};

export default obj;
