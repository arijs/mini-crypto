import randstr from './randstr';
import codePointIterator from './code-point-iterator';

function getSalt(charlist) {
	return {
		salt: function(str, pre, post) {
			pre = randstr(pre, charlist);
			post = randstr(post, charlist);
			return pre+str+post;
		},
		desalt: function(str, pre, post) {
			str = codePointIterator(str, 0).toArray();
			str = str.slice(pre, str.length - post);
			str = str.join('');
			return str;
		}
	};
}

getSalt.randstr = randstr;

export default getSalt;
