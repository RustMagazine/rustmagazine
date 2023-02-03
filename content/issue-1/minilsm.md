MiniLSM is a working-in-progress tutorial series for building a storage engine. Based on the experience of building
[AgateDB](https://github.com/tikv/agatedb) and [RisingWave](https://github.com/risingwavelabs/risingwave), MiniLSM
introduces you the basics of an LSM-tree storage engine with a step-by-step tutorial.

The starter code is accessible on [GitHub](https://github.com/skyzh/mini-lsm), and the tutorial is available on
[GitHub Pages](https://skyzh.github.io/mini-lsm/).

```urlpreview
https://github.com/skyzh/mini-lsm
```

# What is LSM, and Why LSM?

Log-structured merge tree is a data structure to maintain key-value pairs. This data structure is widely used in
distributed database systems like [TiDB](https://www.pingcap.com) and [CockroachDB](https://www.cockroachlabs.com) as
their underlying storage engine. [RocksDB](http://rocksdb.org), based on [LevelDB](https://github.com/google/leveldb),
is an implementation of LSM-tree storage engine. It provides a wide range of key-value access functionalities and is
used in a lot of production systems.

LSM-tree storage engine usually views keys and values as byte array encoded by users. For example, TiDB encodes a row
in the table [in the following way](https://docs.pingcap.com/tidb/dev/tidb-computing#mapping-table-data-to-key-value):

```
| row_id | col1 | col2 | col3 |
|    0   |  1   |  2   |  3   |

key: table1_record00000000
value: encoded([0, 1, 2, 3])
```

where the row is encoded into a byte string, so that LSM engine can easily process it.

Generally speaking, LSM Tree is an append-friendly data structure. It is more intuitive to compare LSM to other
key-value data structure like RB-Tree and B-Tree. For RB-Tree and B-Tree, all data operations are in-place. That is to
say, when you update the value corresponding to the key, the value will be overwritten at its original memory or disk
space. But writes in an LSM Tree, i.e., insertions, updates, deletions, are performed in an append-only way. We will
never change data already written to disk. LSM-tree engine always writes changes to new files (which are called
sorted-string tables, aka. SSTs) and then merge existing files (via compaction).

This architectural design makes LSM tree easy to work with.

1. Data are immutable on persistent storage, which means that it is easier to offload the background tasks (compaction)
   to remote servers. It is also feasible to directly store and serve data from cloud-native storage systems like S3.
2. An LSM tree can balance between read, write and space amplification by changing the compaction algorithm. The data
   structure itself is super versatile and can be optimized for different workloads.

In this tutorial, we will learn how to build an LSM-tree-based storage engine in the Rust programming language.

# Overview of LSM

An LSM storage engine generally contains 3 parts:

1. Write-ahead log to persist temporary data for recovery.
2. SSTs on the disk for maintaining a tree structure.
3. Mem-tables in memory for batching small writes.

The storage engine generally provides the following interfaces:

* `Put(key, value)`: store a key-value pair in the LSM tree.
* `Delete(key)`: remove a key and its corresponding value.
* `Get(key)`: get the value corresponding to a key.
* `Scan(range)`: get a range of key-value pairs.

To ensure persistence,

* `Sync()`: ensure all the operations before `sync` are persisted to the disk.

Some engines choose to combine `Put` and `Delete` into a single operation called `WriteBatch`, which accepts a batch
of key value pairs.

In this tutorial, we assume the LSM tree is using leveled compaction algorithm, which is commonly used in real-world
systems.

# Write Flow

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-write-flow.svg)

The write flow of LSM contains 4 steps:

1. Write the key-value pair to write-ahead log, so that it can be recovered after the storage engine crashes.
2. Write the key-value pair to memtable. After (1) and (2) completes, we can notify the user that the write operation
   is completed.
3. When a memtable is full, we will flush it to the disk as an SST file in the background.
4. We will compact some files in some level into lower levels to maintain a good shape for the LSM tree, so that read
   amplification is low.

# Read Flow

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-read-flow.svg)

When we want to read a key,

1. We will first probe all the memtables from latest to oldest.
2. If the key is not found, we will then search the entire LSM tree containing SSTs to find the data.

# Tutorial Overview

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-tutorial-overview.svg)

## Day 1 - Block Encoding

Block is the minimum read unit in LSM. It is of 4KB size in general, similar database pages. In each block, we will
store a sequence of sorted key value pairs. In day 1, we will explore how to use the `bytes` library to do manual data
encoding. Also, you will learn how to write RocksDB-style iterator in Rust.

**What you will implement:**

```rust
impl BlockBuilder {
    /// Adds a key-value pair to the block. Returns false when the block is full.
    #[must_use]
    pub fn add(&mut self, key: &[u8], value: &[u8]) -> bool {
        unimplemented!()
    }

    /// Finalize the block.
    pub fn build(self) -> Block {}
}

impl BlockIterator {
    /// Returns the key of the current entry.
    pub fn key(&self) -> &[u8] {}

    /// Returns the value of the current entry.
    pub fn value(&self) -> &[u8] {}

    /// Move to the next key in the block.
    pub fn next(&mut self) {}

    /// Seek to the first key that >= `key`.
    pub fn seek_to_key(&mut self, key: &[u8]) {}
}
```

## Day 2 - Table Encoding

SST (sorted string table) is composed of data blocks and index blocks stored on the disk. Usually, data blocks are
lazily loaded -- they will not be loaded into the memory until a user requests it. Index blocks can also be loaded
on-demand, but in this tutorial, we make simple assumptions that all SST index blocks (meta blocks) can fit in memory.
Generally, an SST file is of 256MB size. In day 2, we will implement SST encoding and learn how to compose RocksDB-style
iterators together in Rust.

**What you will implement:**

```rust
impl SsTableBuilder {
    /// Adds a key-value pair to SSTable
    pub fn add(&mut self, key: &[u8], value: &[u8]) {}

    /// Builds the SSTable and writes it to the given path. No need to actually write to disk until
    /// chapter 4 block cache.
    pub fn build(self, ...) -> Result<SsTable> {}
}

impl StorageIterator for SsTableIterator {
    fn value(&self) -> &[u8] {}

    fn key(&self) -> &[u8] {}

    fn is_valid(&self) -> bool {}

    fn next(&mut self) -> Result<()> {}
}
```

## Day 3 - Mem Table and Merge Iterators

In this tutorial, we use [crossbeam-skiplist](https://docs.rs/crossbeam-skiplist) as the implementation of memtable. You
will learn how to use self-referential struct in Rust to erase lifetime from a Rust-style iterator object, and therefore
being easily composed with other RocksDB-style iterators in the system.

Also, we will see how to implement high-performance merge iterators with correct error handling with Rust's `BinaryHeap`.
We intentionally avoid using dynamic dispatch (i.e. `Box<dyn Iterator>`) to achieve higher performance. You will need to
implement two different merge iterators: a two-merge iterator to merge different types of iterators, and a multi-way
merge iterator to merge multiple iterators of the same type. You will have a better understanding of lifetime and trait
system in Rust.

**What you will implement:**

```rust
/// Merge multiple iterators of the same type. If the same key occurs multiple times in some
/// iterators, perfer the one with smaller index.
pub struct MergeIterator<I: StorageIterator> {
    iters: BinaryHeap<HeapWrapper<I>>,
    current: HeapWrapper<I>,
}

/// Merges two iterators of different types into one. If the two iterators have the same key, only
/// produce the key once and prefer the entry from A.
pub struct TwoMergeIterator<A: StorageIterator, B: StorageIterator> {
    a: A,
    b: B,
}

/// A basic mem-table based on crossbeam-skiplist
pub struct MemTable {
    map: crossbeam_skiplist::SkipMap<Bytes, Bytes>,
}
```

## Day 4 - Storage Engine and Block Cache

In this part, you will need to compose everything you have implemented in previous parts to build a fully functional
storage engine. You will explore how surprisingly easy for us to maintain object references and ownerships in a
multi-thread program with the help of borrow checker.


**What you will implement:**

```rust
impl LsmStorage {
    /// Get a key from the storage. In day 7, this can be further optimized by using a bloom filter.
    pub fn get(&self, key: &[u8]) -> Result<Option<Bytes>> {}

    /// Put a key-value pair into the storage by writing into the current memtable.
    pub fn put(&self, key: &[u8], value: &[u8]) -> Result<()> {}

    /// Remove a key from the storage by writing an empty value.
    pub fn delete(&self, _key: &[u8]) -> Result<()> {}

    /// Persist data to disk.
    ///
    /// In day 3: flush the current memtable to disk as L0 SST.
    /// In day 6: call `fsync` on WAL.
    pub fn sync(&self) -> Result<()> {}

    /// Create an iterator over a range of keys.
    pub fn scan(
        &self,
        _lower: Bound<&[u8]>,
        _upper: Bound<&[u8]>,
    ) -> Result<FusedIterator<LsmIterator>> {}
}
```

## Day 5 - Compaction

We now have an LSM structure, and we can merge some files in the background so as to clean garbage data and improve
read efficiency. We will use RocksDB's leveled compaction algorithm to do the compaction.

## Day 6 - Recovery

Storage engine should have durability, which means that data won't be lost after the engine crashes. In LSM-tree, we
achieve durability by using a WAL (write-ahead log). In day 6, you will modify the write path to persist in-memory
data to disk, and implement recovery process on startup.

## Day 7 - Optimizations

Two key optimizations are widely adapted in today's LSM-tree engines -- prefix key compression and bloom filter. We
will implement the new key encoding and the bloom filter in the last day.
