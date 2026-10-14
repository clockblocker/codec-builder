export type Expect<Value extends true> = Value;

export type ExpectFalse<Value extends false> = Value;

export type IsAny<Value> = 0 extends 1 & Value ? true : false;

export type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;
