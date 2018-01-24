
function isSurrogateHigh(n) {
	return 0xd800 <= n && n <= 0xdbff;
}
function isSurrogateLow(n) {
	return 0xdc00 <= n && n <= 0xdfff;
}

function codePointIterator(str, i) {
	var slen = str.length;
	var pos;
	setPos(i);
	return {
		current: current,
		move: move,
		isFirst: isFirst,
		isLast: isLast,
		setPos: setPos,
		hasPos: hasPos,
		forEach: forEach
	};
	function setPos(i) {
		i = +i ? (i > 0 ? i : slen - i) : 0;
		tryPos(i);
		pos = correctPos(i);
	}
	function hasPos(pos) {
		return 0 <= pos && pos < slen;
	}
	function isFirst() {
		return pos[0] == 0;
	}
	function isLast() {
		return (pos[0] + pos[1]) == slen;
	}
	function tryPos(pos) {
		if (!hasPos(pos)) {
			throw new Error('Out of bounds: pos '+pos+' of string with length '+slen);
		}
	}
	function correctPos(p) {
		var clen = 1;
		if (isSurrogateLow(str.charCodeAt(p))) {
			clen = 2;
			p--;
		}
		if (isSurrogateHigh(str.charCodeAt(p))) {
			clen = 2;
		}
		return [p, clen];
	}
	function move(walk) {
		var step = (walk == 0) ? 0 : (walk > 0 ? 1 : -1);
		while (walk) {
			var p = pos[0];
			walk -= step;
			p += (step == 1 && pos[1] == 2) ? 2 : step;
			tryPos(p);
			pos = correctPos(p);
		}
	}
	function current() {
		var p = pos[0];
		var l = pos[1];
		return {
			index: p,
			length: l,
			chr: str.substr(p, l)
		};
	}
	var _break = {};
	var ctx = {
		_break: _break
	};
	function forEach(mv, fn) {
		if (!mv) throw new Error('Invalid CodePointIterator forEach move '+mv);
		for(;;) {
			var p = pos[0];
			var l = pos[1];
			var c = str.substr(p, l);
			var ret = fn.call(ctx, c, p, l);
			var isEnd = move > 0 ? isLast() : isFirst();
			if ( isEnd || ret === _break ) {
				break;
			} else {
				move(mv);
			}
		}
	}
}

codePointIterator.isSurrogateHigh = isSurrogateHigh;
codePointIterator.isSurrogateLow = isSurrogateLow;

export default codePointIterator;
