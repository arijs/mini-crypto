
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
		setPos: setPos,
		hasPos: hasPos,
		isFirst: isFirst,
		isLast: isLast,
		codePoint: codePoint,
		current: current,
		move: move,
		forEach: forEach,
		toArray: toArray,
		toCodePointArray: toCodePointArray
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
	function codePoint() {
		var first = str.charCodeAt(pos[0]);
		var second = pos[1] == 2 ? str.charCodeAt(pos[0]+1) : 0;
		if (isSurrogateHigh(first) && isSurrogateLow(second)) {
			return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
		}
		return first;
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
	function toArray() {
		var list = [];
		forEach(1, function(c) {
			list.push(c);
		});
		return list;
	}
	function toCodePointArray() {
		var list = [];
		forEach(1, function() {
			list.push(codePoint());
		});
		return list;
	}
}

codePointIterator.isSurrogateHigh = isSurrogateHigh;
codePointIterator.isSurrogateLow = isSurrogateLow;

export default codePointIterator;
