
function getSum(str, params, calcFn) {
	var slen = str && str.length || 0;
	var mod = params.mod;
	var sum, n;
	if (!calcFn) calcFn = calcSumDefault;
	if ( slen < 16 && !params.unsafe ) throw new Error('Seed too short: '+slen+' ('+str+')');
	sum = params.start;
	for ( var i = 0; i < slen; i++ ) {
		n = str.charCodeAt(i);
		sum = calcFn(slen, i, n, sum, mod);
	}
	return sum;
}

function calcSumDefault(stringLength, charIndex, charCode, currentSum, modulo) {
	currentSum += (stringLength + charCode) *
		((currentSum % 1024) + 1) *
		((charIndex % 64) + 1) +
		charCode + (stringLength - charIndex) + 1;
	currentSum %= modulo;
	return currentSum;
}

export default getSum;
