
function charOffset(list, offset) {
	offset = [].concat(offset || []);
	offset[0] || (offset[0] = 1);
	var index = getIndex(list)
		, invert = invOffset(offset);
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
	var index = {}
		, i = 0
		, count = list.length;
	for ( i = 0; i < count; i++ ) {
		index[list[i]] = i;
	}
	return index;
}

function convert(str, list, index, offset) {
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

export default obj;
