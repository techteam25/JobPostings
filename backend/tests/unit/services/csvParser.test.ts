import { describe, it, expect } from "vitest";
import { Readable } from "stream";
import { StreamingCsvParser } from "@/services/csvParser";

describe("StreamingCsvParser", () => {
    describe("parseString", () => {
        it("should parse basic CSV with headers", async () => {
            const parser = new StreamingCsvParser();
            const csv = "name,age,city\nAlice,30,Lagos\nBob,25,Abuja";

            const result = await parser.parseString(csv);

            expect(result).toEqual([
                { name: "Alice", age: "30", city: "Lagos" },
                { name: "Bob", age: "25", city: "Abuja" },
            ]);
        });

        it("should handle quoted fields containing commas", async () => {
            const parser = new StreamingCsvParser();
            const csv = 'name,address\n"Smith, John","123 Main St, Apt 4"';

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Smith, John");
            expect(result[0].address).toBe("123 Main St, Apt 4");
        });

        it("should handle escaped quote characters within quoted fields", async () => {
            const parser = new StreamingCsvParser();
            const csv = 'title,description\n"CEO","She said ""hello"" to everyone"';

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("CEO");
            expect(result[0].description).toBe('She said "hello" to everyone');
        });

        it("should handle empty fields", async () => {
            const parser = new StreamingCsvParser();
            const csv = "name,email,phone\nAlice,,555-1234\n,bob@test.com,";

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ name: "Alice", email: "", phone: "555-1234" });
            expect(result[1]).toEqual({ name: "", email: "bob@test.com", phone: "" });
        });

        it("should skip empty lines", async () => {
            const parser = new StreamingCsvParser();
            const csv = "name,age\nAlice,30\n\nBob,25\n\n";

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("Alice");
            expect(result[1].name).toBe("Bob");
        });

        it("should trim whitespace from fields", async () => {
            const parser = new StreamingCsvParser();
            const csv = "name , age \n Alice , 30 \n Bob , 25 ";

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ name: "Alice", age: "30" });
            expect(result[1]).toEqual({ name: "Bob", age: "25" });
        });

        it("should handle multiline values within quoted fields", async () => {
            const parser = new StreamingCsvParser();
            const csv = 'name,bio\nAlice,"Software engineer\nwho loves coding"';

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Alice");
            expect(result[0].bio).toBe("Software engineer\nwho loves coding");
        });

        it("should return empty array for CSV with only headers", async () => {
            const parser = new StreamingCsvParser();
            const csv = "name,age,city";

            const result = await parser.parseString(csv);

            expect(result).toEqual([]);
        });
    });

    describe("custom delimiters", () => {
        it("should parse semicolon-delimited CSV", async () => {
            const parser = new StreamingCsvParser({ delimiter: ";" });
            const csv = "name;age;city\nAlice;30;Lagos\nBob;25;Abuja";

            const result = await parser.parseString(csv);

            expect(result).toEqual([
                { name: "Alice", age: "30", city: "Lagos" },
                { name: "Bob", age: "25", city: "Abuja" },
            ]);
        });

        it("should parse tab-delimited CSV", async () => {
            const parser = new StreamingCsvParser({ delimiter: "\t" });
            const csv = "name\tage\nAlice\t30\nBob\t25";

            const result = await parser.parseString(csv);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("Alice");
            expect(result[1].age).toBe("25");
        });
    });

    describe("parse (streaming)", () => {
        it("should yield records one at a time from a stream", async () => {
            const parser = new StreamingCsvParser();
            const csv = "id,value\n1,one\n2,two\n3,three";
            const input = Readable.from([csv]);

            const records: Record<string, string>[] = [];
            for await (const record of parser.parse(input)) {
                records.push(record);
            }

            expect(records).toHaveLength(3);
            expect(records[0]).toEqual({ id: "1", value: "one" });
            expect(records[2]).toEqual({ id: "3", value: "three" });
        });

        it("should handle chunked input stream correctly", async () => {
            const parser = new StreamingCsvParser();
            // Simulate a stream that delivers data in multiple chunks
            const chunks = ["name,age\nAli", "ce,30\nBob,", "25\n"];
            const input = new Readable({
                read() {
                    const chunk = chunks.shift();
                    if (chunk !== undefined) {
                        this.push(chunk);
                    } else {
                        this.push(null);
                    }
                },
            });

            const records: Record<string, string>[] = [];
            for await (const record of parser.parse(input)) {
                records.push(record);
            }

            expect(records).toHaveLength(2);
            expect(records[0]).toEqual({ name: "Alice", age: "30" });
            expect(records[1]).toEqual({ name: "Bob", age: "25" });
        });
    });

    describe("columns option", () => {
        it("should allow custom column names", async () => {
            const parser = new StreamingCsvParser({
                columns: ["first", "second", "third"],
            });
            const csv = "Alice,30,Lagos\nBob,25,Abuja";

            const result = await parser.parseString(csv);

            expect(result).toEqual([
                { first: "Alice", second: "30", third: "Lagos" },
                { first: "Bob", second: "25", third: "Abuja" },
            ]);
        });
    });
});
