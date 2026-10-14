export type Expect<Value extends true> = Value;

export type ExpectFalse<Value extends false> = Value;

export type IsAny<Value> = 0 extends 1 & Value ? true : false;
