// tslint:disable:max-classes-per-file

export class UnexpectedRowCountError extends Error {
    constructor(
        public schema: string,
        public table: string,
        public expected: number,
        public actual: number,
    ) {
        super(`unexpected row count expected ${expected}, actual ${actual}`);
    }
}

export class UniqueConstraintError extends Error {
    constructor(
        public schema: string,
        public table: string,
        public innerError: Error,
    ) {
        super(innerError.message);
    }
}
