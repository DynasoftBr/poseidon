import { Decimal, EntityType } from '../sdk/decorators.js';
import type { Decimal as DecimalValue } from '../sdk/decimal.js';

@EntityType({ label: 'Money' })
export class Money {
    @Decimal({ min: '0', max: '99999999999999.9999' })
    amount!: DecimalValue;
    currency!: 'GBP' | 'USD' | 'EUR';
}
