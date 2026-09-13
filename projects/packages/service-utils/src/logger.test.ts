import { getLogger } from './logger';

describe('getLogger', () => {
    it('should create a logger for the supplied component', () => {
        expect(getLogger('runtime').bindings().name).toBe('runtime');
    });
});
