
function verifyList(list) {
	var map = {}, c;
	for ( var i = 0, ii = list.length; i < ii; i++ ) {
		c = list.charAt(i);
		if ( c in map ) throw new Error('Repeated character: "'+c+'"');
		map[c] = true;
	}
	return list;
}

var defaults =
		{ chars:
			{ letterup: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			, letterdown: 'abcdefghijklmnopqrstuvwxyz'
			, accentup: 'ÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ'
			, accentdown: 'àáâãäèéêëìíîïòóôõöùúûüçñ'
			, numbers: '0123456789'
			, punct1: '.,:;*+-/<=>()[]{} '
			, punct2: '!"#$%&\'?@\\^|~_`´'
			, punct3: '¡¢£¤¥¦§¨©ª«¬­®¯°±²³µ¶·¹º»¼½¾¿×÷ '
			}
		, list: ''
		, offset: 32
		, scheme: null
		};

defaults.list = (function(c) {
	// The sum of all these chars is 144
	return verifyList(
		''.concat(
			c.letterup,
			c.letterdown,
			c.accentup,
			c.accentdown,
			c.numbers,
			c.punct1,
			c.punct2));
})(defaults.chars);

defaults.all = (function(c) {
	// The sum of all these chars is 176
	return verifyList(
		''.concat(
			c.letterup,
			c.letterdown,
			c.accentup,
			c.accentdown,
			c.numbers,
			c.punct1,
			c.punct2,
			c.punct3));
})(defaults.chars);

function getScheme(offset, list) {
	var emap = {}
		, dmap = {}
		, i = 0
		, olen, av, al, j, b, c, o;

	offset || (offset = defaults.offset);
	list || (list = defaults.list);
	if ( !offset instanceof Array ) offset = [offset];
	olen = offset.length;
	av = list;
	al = av.length;

	while ( al ) {
		o = offset[i%olen] || 0;
		j = (i + o) % al;
		j < 1 && al > 1 && (j = (1 + al) * 0.5 |0);
		c = av.substr(j, 1);
		av = av.substr(0, j)+av.substr(j+1);
		b = list[i];
		//console.log(i, j, list[i], c);
		emap[b] = c;
		dmap[c] = b;
		al = av.length;
		i++;
	}

	return (
		{ offset: offset
		, list: list
		, encode: emap
		, decode: dmap
		});
}

defaults.scheme = getScheme();

function convert(str, map) {
	if ( str == null ) throw new Error('No string to convert');
	var conv = '', c;
	for ( var i = 0, ii = str.length; i < ii; i++ ) {
		c = str.charAt(i);
		c = c in map ? map[c] : c;
		conv += c;
	}
	return conv;
}

function custom(offset, list) {
	var scheme = (offset || list)
			? getScheme(offset, list)
			: defaults.scheme;
	return (
		{ scheme: scheme
		, encode: function(str) {
				return convert(str, scheme.encode);
			}
		, decode: function(str) {
				return convert(str, scheme.decode);
			}
		});
}

var cripto = custom();
cripto.defaults = defaults;
cripto.custom = custom;

export default cripto;
