
function getSum(str, params) {
	var slen = str && str.length || 0;
	var mod = params.mod;
	var sum, n;
	if ( slen < 16 ) throw new Error('Seed too short: '+slen+' ('+str+')');
	sum = params.start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		sum += (slen + n) * ((sum % 1024) + 1) * ((i % 64) + 1);
		sum %= mod;
	}
	return sum;
}

export default getSum;
