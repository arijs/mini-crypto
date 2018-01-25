/* eslint no-console:1 */

export default function randstr(len, charlist) {
	var clen = charlist.length;
	var rand = '';
	for ( var i = 0; i < len; i++ ) {
		var ci = (Math.random()*clen)%clen|0;
		rand += (clen && charlist[ci]) || ' ';
	}
	return rand;
}
