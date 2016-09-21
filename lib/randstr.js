
export default function randstr(len, charlist) {
	var clen = charlist.length
		, rand = '';
	for ( var i = 0; i < len; i++ ) {
		rand += clen && charlist.charAt((Math.random()*clen)%clen) || ' ';
	}
	return rand;
}
