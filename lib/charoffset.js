
function charOffset(offset, list) {
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

function getOffset(seed, sum, offset, list) {
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
	var chOffset = getOffset(seed, sum, offset, list);
	return charOffset(chOffset, list);
}

var obj =
		{ offset: charOffset
		, seed: charSeed
		, getOffset: getOffset
		};

export default obj;
