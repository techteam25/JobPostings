import { parse, Options as CsvParseOptions } from "csv-parse";
import { Readable } from "stream";
import { createReadStream } from "fs";
import logger from "@/logger";

/**
 * Configuration options for the CSV parser.
 */
export interface CsvParserOptions {
    /** Column delimiter character. Defaults to ',' */
    delimiter?: string;
    /** Quote character for enclosing fields. Defaults to '"' */
    quote?: string;
    /** Escape character within quoted fields. Defaults to '"' */
    escape?: string;
    /** Whether to treat the first row as column headers. Defaults to true */
    columns?: boolean | string[];
    /** Whether to skip empty lines. Defaults to true */
    skipEmptyLines?: boolean;
    /** Whether to trim whitespace from fields. Defaults to true */
    trim?: boolean;
}

/**
 * Production-grade CSV parser using Node.js streams and the `csv-parse` library.
 *
 * Design decisions:
 * - **Streaming**: Uses async generators to process CSV data line-by-line,
 *   avoiding loading entire files into memory. Safe for large files.
 * - **Delegated parsing**: Uses `csv-parse` for RFC 4180-compliant parsing,
 *   correctly handling quoted fields, embedded commas, escaped quotes, and
 *   different line endings.
 * - **Configurable**: Supports custom delimiters, quote characters, and other
 *   options via constructor injection.
 *
 * @example
 * ```typescript
 * const parser = new StreamingCsvParser();
 *
 * // Parse a file as a stream
 * for await (const record of parser.parseFile("data.csv")) {
 *   console.log(record);
 * }
 *
 * // Parse a string (convenience for small inputs)
 * const records = await parser.parseString('name,age\nAlice,30\n"Bob, Jr.",25');
 * ```
 */
export class StreamingCsvParser {
    private readonly csvOptions: CsvParseOptions;

    constructor(options: CsvParserOptions = {}) {
        this.csvOptions = {
            delimiter: options.delimiter ?? ",",
            quote: options.quote ?? '"',
            escape: options.escape ?? '"',
            columns: options.columns ?? true,
            skip_empty_lines: options.skipEmptyLines ?? true,
            trim: options.trim ?? true,
            relax_column_count: true,
        };
    }

    /**
     * Parses a readable stream of CSV data, yielding one record at a time.
     * This is the primary method — it processes data in constant memory
     * regardless of file size.
     *
     * @param input - A Node.js Readable stream containing CSV data.
     * @yields Parsed records as key-value objects (when `columns` is true)
     *         or as string arrays.
     * @throws Error if the CSV data is malformed and cannot be parsed.
     */
    async *parse(
        input: Readable,
    ): AsyncGenerator<Record<string, string>> {
        const parser = input.pipe(
            parse(this.csvOptions),
        );

        parser.on("error", (err) => {
            logger.error({ err }, "CSV parsing stream error");
        });

        for await (const record of parser) {
            yield record;
        }
    }

    /**
     * Convenience method to parse a CSV string into an array of records.
     * Suitable for small to moderate data — loads all results into memory.
     *
     * @param csvData - Raw CSV string to parse.
     * @returns Array of parsed records.
     */
    async parseString(csvData: string): Promise<Record<string, string>[]> {
        const readable = Readable.from([csvData]);
        const results: Record<string, string>[] = [];

        for await (const record of this.parse(readable)) {
            results.push(record);
        }

        return results;
    }

    /**
     * Parses a CSV file by path using a file read stream.
     * Processes data in constant memory regardless of file size.
     *
     * @param filePath - Absolute path to the CSV file.
     * @yields Parsed records one at a time.
     */
    async *parseFile(
        filePath: string,
    ): AsyncGenerator<Record<string, string>> {
        const input = createReadStream(filePath, { encoding: "utf-8" });

        try {
            yield* this.parse(input);
        } finally {
            input.destroy();
        }
    }
}
