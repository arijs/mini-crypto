
var inv256 = 1/1048576
	, factor = 655361*inv256;

function getSeed(str, mod, start) {
	var c, n, slen = str && str.length || 0;
	if ( slen < 16 ) throw new Error('Seed too short: '+slen+' ('+str+')');
	mod = +mod|0 || (1024 * 1024 * 1024);
	start = (+start|0) % mod || (mod*factor)|0;
	c = start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		c += (n % mod) * (((c % 32) * i + 1) % 32);
		c %= mod;
	}
	return (
		{ seed: c
		, mod: mod
		, start: start
		});
}

export default getSeed;
