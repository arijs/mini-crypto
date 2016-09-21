import miniCrypto from '../mini-crypto';
import { strictEqual } from 'assert';

describe('mini-crypto', () => {

  it('returns a object', () => {
    strictEqual(typeof miniCrypto, 'object');
  });

});
