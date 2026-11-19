A Rust parser that reports line and column for every element can spend more time finding those numbers than reading the document. I hit that in [vastlint](https://github.com/aleksUIX/vastlint), an XML checker. Each element already had a byte offset. Turning that offset into a line and column scanned from byte zero every time. A cursor that remembers its place makes the same work a single forward pass.

This is the parser change behind a release I measured on 4 October 2026. The same account, with the benchmark method and the files, is on [vastlint.org](https://vastlint.org/blog/vastlint-15x-faster/).

# The old helper started over

The reader already knows where an element begins, as a byte offset into the input. A finding is more useful with a line and a column, so the parser attaches that location while it builds the document, including for self-closing elements. That work happens even when the document passes every check and there is nothing to report.

The old helper, `byte_offset_to_line_col`, started at byte zero on every call. For the next element it counted the same prefix again, then continued to the new offset. The reader moved forward. The location helper did not.

Four elements at 10, 20, 30 and 40 KB make the cost obvious. The helper scans 10 KB, then 20 KB, then 30 KB, then 40 KB. That is 100 KB of scanning to reach a position 40 KB into the input. Those figures are byte counts, not timings.

In a document with thousands of elements, the parser can recount the beginning thousands of times. If the document grows while the density of elements stays about the same, that repeated work can grow roughly with the square of the size. Byte size alone does not predict it. One long URL adds bytes and almost no calls. A document with many elements adds a call per element.

# The cursor keeps its place

`LineCursor` is created once per document. It stores the previous byte position, the current line, and the byte where that line starts. The next element scans only the slice between the previous position and the new offset. A newline increments the line and moves the line start. The column is the offset minus the line start, plus one, because both line and column are 1-based and the column counts bytes.

```rs
struct LineCursor {
    pos: usize,
    line: u32,
    line_start: usize,
}

impl LineCursor {
    fn new() -> Self {
        LineCursor { pos: 0, line: 1, line_start: 0 }
    }

    fn locate(&mut self, input: &[u8], offset: usize) -> (u32, u32) {
        let safe = offset.min(input.len());
        if safe < self.pos {
            *self = LineCursor::new();
        }
        for (i, &b) in input[self.pos..safe].iter().enumerate() {
            if b == b'\n' {
                self.line += 1;
                self.line_start = self.pos + i + 1;
            }
        }
        self.pos = safe;
        (self.line, (safe - self.line_start) as u32 + 1)
    }
}
```

The same four positions are now four successive 10 KB slices: 40 KB of scanning instead of 100 KB. Elements arrive in document order, so the slices do not overlap. Each byte is visited at most once for location tracking. Parsing and the checks that run after it still have their own cost.

An offset behind the cursor restarts from byte zero. That path exists so a caller can ask for an earlier position. The documents this parser builds do not need it on the forward walk.

# What the measurements showed

I compared the previous release, 0.13.13, with 0.14.0. The runtime difference in the parser is this cursor. Both builds used the same compiler, dependencies and allocator.

On an Apple M4, with rustc 1.97.1, a complete command-line pass over 80,000 generated documents from 58 KB to 200 KB took 5 minutes 3 seconds before and 19.6 seconds after. Both runs used eight worker processes. The batch includes process launches, file reads, validation, JSON reports and a check that every report came back. That is a 15.4 times improvement on that workload. The documents were generated, valid, and produced no findings. A library that emits a large issue list can take longer.

A separate in-memory comparison used ten generated documents from 58 KB to 100 KB, checked serially with `vastlint_core::validate` in release builds. The median of 21 complete batches fell from 168.3 ms to 11.8 ms. One measured 58 KB document fell from 27.7 ms to 0.39 ms, with the same findings and locations. On an earlier set of smaller documents the 99th percentile fell from 3.37 ms to 0.81 ms. Those smaller-document timings used rustc 1.91.1.

Denser documents moved further. A 274 KB document with many elements fell from 109.6 ms to 2.38 ms. A 2 MB document fell from a median of 23.3 seconds to 81.4 ms. A 10 MB document fell from 9.2 minutes to 361 ms, and that pair was a single run per build. The old 2 MB timings varied a lot, so I would not treat the largest ratios as a stable benchmark.

A control padded with one huge URL did not show the same gain. At 10 MB it took about 20 ms before and 25 ms after. The change targets repeated scans in documents with many elements. Extra bytes with few elements are a different cost.

Before shipping I compared 150 XML fixtures and a private set of stored documents. Rule id, path, line, column and severity matched. The stored documents produced the same 8,112 issues, and `cargo test --all` passed with the cursor in place. The generated fixtures, runners and timing records are in the [benchmark package](https://vastlint.org/data/vastlint-line-cursor/benchmark-artifacts.zip). The stored XML stays private, so those percentiles cannot be recomputed from the published files.

# What I would keep

Record the last offset, the line, and the start of that line. Scan only the gap. Reset if a caller asks for an earlier offset. The location pass is then linear in the document, and the reported line and column stay the ones the old scan produced.
