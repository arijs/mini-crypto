
import codePointIterator from './code-point-iterator';

function shuffle(str, offset) {
	var result = [];
	var rlen = 0;
	var oloop = 0;
	var olen = offset.length;
	if (!str.length) return result.join('');
	// for ( var si = 0, oi = 0; si < slen; si++, oi++ ) {
	// 	if (oi >= olen) {
	// 		oloop++;
	// 		oi -= olen;
	// 	}
	// 	var on = offset[(oi + oloop) % olen];
	// 	result[si] = str[si + (on % (slen - si))];
	// }
	var iter = codePointIterator(str, 0);
	while (true) {
		var c = iter.current();
		var on = offset[(rlen + oloop) % olen];
		var ci = rlen == 0 ? 0 : on % rlen;
		result.splice(ci, 0, c.chr);
		rlen = result.length;
		console.log(rlen, ci, c.chr);
		if (iter.isLast()) {
			break;
		} else {
			iter.move(1);
		}
	}
	return result.join('');
}

function deshuffle(str, offset) {

}
