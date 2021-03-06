import * as test from "blue-tape";
import { using } from "dispose";
import { PgContext } from "pg-context";
import { UnexpectedRowCountError, UniqueConstraintError } from "./error";
import { RowDescriptor } from "./row-descriptor";
import { TableTransaction } from "./table-transaction";

const sql = `
CREATE TABLE public.one(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
INSERT INTO public.one(name)
VALUES('one'), ('two');
`;

interface OneRow {
    id: number;
    name: string;
}

const OneRowDescriptor: RowDescriptor<OneRow> = {
    schema: "public",
    table: "one",
};

test(
    "TableTransaction#single",
    async t => using(PgContext.create(sql, { user: "postgres" }), async ({ pool }) => {
        {
            const row = await TableTransaction.execute(pool, q => q.single(
                OneRowDescriptor,
                { id: 2 },
            ));

            t.deepEqual(row, { id: 2, name: "two" });
        }
        try {
            const row = await TableTransaction.execute(pool, q => q.single(
                OneRowDescriptor,
                { id: 4 },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UnexpectedRowCountError);
        }
    }),
);

test(
    "TableTransaction#singleOrNull",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableTransaction.execute(pool, q => q.singleOrNull(
                OneRowDescriptor,
                { id: 2 },
            ));

            t.deepEqual(row, { id: 2, name: "two" });
        }

        {
            const row = await TableTransaction.execute(pool, q => q.singleOrNull(
                OneRowDescriptor,
                { id: 4 },
            ));

            t.equal(row, null);
        }
    }),

);

test(
    "TableTransaction#multiple",
    async t => using(PgContext.create(sql, { user: "postgres" }), async ({ pool }) => {
        const rows = await TableTransaction.execute(pool, q => q.multiple(
            OneRowDescriptor,
            { id: 2 },
        ));

        t.deepEqual(rows, [{ id: 2, name: "two" }]);
    }),
);

test(
    "TableTransaction#insert",
    async t => using(PgContext.create(sql, { user: "postgres" }), async ({ pool }) => {
        {
            const row = await TableTransaction.execute(pool, q => q.insert(
                OneRowDescriptor,
                { name: "three" },
            ));

            t.deepEqual(row, { id: 3, name: "three" });
        }

        try {
            const row = await TableTransaction.execute(pool, q => q.insert(
                OneRowDescriptor,
                { id: 1, name: "four" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UniqueConstraintError);
        }

        try {
            const row = await TableTransaction.execute(pool, q => q.insert(
                OneRowDescriptor,
                { id: 5, name: "one" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UniqueConstraintError);
        }
    }),
);

test(
    "TableTransaction#update",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        {
            const row = await TableTransaction.execute(pool, q => q.update(
                OneRowDescriptor,
                { name: "one" },
                { name: "een" },
            ));

            t.deepEqual(row, { id: 1, name: "een" });
        }

        try {
            const row = await TableTransaction.execute(pool, q => q.update(
                OneRowDescriptor,
                { name: "one" },
                { name: "een" },
            ));

            t.fail();
        }
        catch (err) {
            t.ok(err instanceof UnexpectedRowCountError);
        }
    }),
);

test(
    "TableTransaction#upsert",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        const row = await TableTransaction.execute(pool, q => q.upsert(
            OneRowDescriptor,
            { id: 2 },
            { name: "twee" },
        ));

        t.deepEqual(row, { id: 2, name: "twee" });
    }),
);

test(
    "TableTransaction#delete",
    async t => using(PgContext.create(sql), async ({ pool }) => {
        const row = await TableTransaction.execute(pool, q => q.delete(
            OneRowDescriptor,
            { id: 2 },
        ));

        t.deepEqual(row, { id: 2, name: "two" });
    }),
);
