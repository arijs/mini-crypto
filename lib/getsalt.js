import randstr from './randstr';

function getSalt(charlist) {
	return (
		{ salt: function(str, pre, post) {
				pre = randstr(pre, charlist);
				post = randstr(post, charlist);
				return pre+str+post;
			}
		, desalt: function(str, pre, post) {
				return str.substr(pre, str.length-pre-post);
			}
		});
}

getSalt.randstr = randstr;

export default getSalt;
