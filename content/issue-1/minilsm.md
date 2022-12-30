MiniLSM is a working-in-progress tutorial series for building a storage engine. Based on the experience of building
[AgateDB](https://github.com/tikv/agatedb) and [RisingWave](https://github.com/risingwavelabs/risingwave), MiniLSM
introduces you the basics of an LSM-tree storage engine with a step-by-step tutorial.

The starter code is accessible on [GitHub](https://github.com/skyzh/mini-lsm), and the tutorial is available on
[GitHub Pages](https://skyzh.github.io/mini-lsm/).

```urlpreview
https://github.com/skyzh/mini-lsm
```

## What is LSM, and Why LSM?

Log-structured merge tree is a data structure to maintain key-value pairs. This data structure is widely used in
distributed database systems like [TiDB](https://www.pingcap.com) and [CockroachDB](https://www.cockroachlabs.com) as
their underlying storage engine. [RocksDB](http://rocksdb.org), based on [LevelDB](https://github.com/google/leveldb),
is an implementation of LSM-Tree storage engine. It provides a wide range of key-value access functionalities and is
used in a lot of production systems.

Generally speaking, LSM Tree is an append-friendly data structure. It is more intuitive to compare LSM to other
key-value data structure like RB-Tree and B-Tree. For RB-Tree and B-Tree, all data operations are in-place. That is to
say, when you update the value corresponding to the key, the value will be overwritten at its original memory or disk
space. But in an LSM Tree, all write operations, i.e., insertions, updates, deletions, are performed in somewhere else.
These operations will be batched into SST (sorted string table) files and be written to the disk. Once written to the
disk, the file will not be changed. These operations are applied lazily on disk with a special task called compaction.
The compaction job will merge multiple SST files and remove unused data.

This architectural design makes LSM tree easy to work with.

1. Data are immutable on persistent storage, which means that it is easier to offload the background tasks (compaction)
   to remote servers. It is also feasible to directly store and serve data from cloud-native storage systems like S3.
2. An LSM tree can balance between read, write and space amplification by changing the compaction algorithm. The data
   structure itself is super versatile and can be optimized for different workloads.

In this tutorial, we will learn how to build an LSM-Tree-based storage engine in the Rust programming language.

## Overview of LSM

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

## Write Flow

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-write-flow.svg)

The write flow of LSM contains 4 steps:

1. Write the key-value pair to write-ahead log, so that it can be recovered after the storage engine crashes.
2. Write the key-value pair to memtable. After (1) and (2) completes, we can notify the user that the write operation
   is completed.
3. When a memtable is full, we will flush it to the disk as an SST file in the background.
4. We will compact some files in some level into lower levels to maintain a good shape for the LSM tree, so that read
   amplification is low.

## Read Flow

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-read-flow.svg)

When we want to read a key,

1. We will first probe all the memtables from latest to oldest.
2. If the key is not found, we will then search the entire LSM tree containing SSTs to find the data.

## Tutorial Overview

![](https://skyzh.github.io/mini-lsm/figures/lsm-tutorial/00-lsm-tutorial-overview.svg)

As of the end of 2022, we have finished the first 4 parts of the tutorial.

### Day 1 - Block Encoding

Block is the minimum read unit in LSM. It is of 4KB size in general, similar database pages. In each block, we will
store a sequence of sorted key value pairs. In day 1, we will explore how to use the `bytes` library to do manual data
encoding. Also, you will learn how to write RocksDB-style iterator in Rust.

### Day 2 - Table Encoding

SST (sorted string table) is composed of data blocks and index blocks stored on the disk. Usually, data blocks are
lazily loaded -- they will not be loaded into the memory until a user requests it. Index blocks can also be loaded
on-demand, but in this tutorial, we make simple assumptions that all SST index blocks (meta blocks) can fit in memory.
Generally, an SST file is of 256MB size. In day 2, we will implement SST encoding and learn how to compose RocksDB-style
iterators together in Rust.

### Day 3 - Mem Table and Merge Iterators

In this tutorial, we use [crossbeam-skiplist](https://docs.rs/crossbeam-skiplist) as the implementation of memtable. You
will learn how to use self-referential struct in Rust to erase lifetime from a Rust-style iterator object, and therefore
being easily composed with other RocksDB-style iterators in the system.

Also, we will see how to implement high-performance merge iterators with correct error handling with Rust's `BinaryHeap`.
We intentionally avoid using dynamic dispatch (i.e. `Box<dyn Iterator>`) to achieve higher performance. You will need to
implement two different merge iterators: a two-merge iterator to merge different types of iterators, and a multi-way
merge iterator to merge multiple iterators of the same type. You will have a better understanding of lifetime and trait
system in Rust.

### Day 4 - Storage Engine and Block Cache

In this part, you will need to compose everything you have implemented in previous parts to build a fully functional
storage engine. You will explore how surprisingly easy for us to maintain object references and ownerships in a
multi-thread program with the help of borrow checker.

## Upcoming Chapters

We will add compaction, recovery and LSM optimizations to this tutorial in the future. Hope this tutorial will be a
very exciting journey for anyone interested in database and storage systems.