
import codePointIterator from './code-point-iterator';

var obj = {
	getExchanges: getExchanges,
	shuffleExChars: shuffleExChars,
	deshuffleExChars: deshuffleExChars,
	shuffle: shuffle,
	deshuffle: deshuffle
};

export default obj;

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
