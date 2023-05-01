**A Data Science View of ChatGPT and Bard**

&nbsp;&nbsp;&nbsp;What if a Teacher asked the entire class to write a nonsense poem as a creative task for homework?  If a whole class of 35 uses ChatGPT or Bard to write a nonsense poem about a runcible spoon – would the teacher be able to tell?  In other words, is the output repetitive if asked to carry out a specific task several times.  Even the number of verses or a pattern in the length of the sentences could alert our teacher and the game could be up!

&nbsp;&nbsp;&nbsp;To test this out, I collected a set of 35 poems requesting both ChatGPT and Bard to “write a nonsense poem about a runcible spoon”, on several different days and times and saving the results to a text file.  So, let’s focus on the runcible spoon, a made-up word or so I thought.  It turned out ChatGPT knew more than me on that point.  "Runcible" far from being a made-up word turns out to be a description of a utensil somewhere between a spoon and a fork from the olden days (like a “spork” used in camping).  

&nbsp;&nbsp;&nbsp;In different poems, the spoon was described as silly, odd, fancy, chic, wriggly and bright, of silver, of tin, of bubblegum and glue, of gold, had powers untold, with a handle made of silver, wood, jelly, shaped like a pair of dice, made of a rainbow’s light, made of a metal that nobody knows, glows in the dark like a bright red rose.

&nbsp;&nbsp;&nbsp;The spoon was many times described by ChatGPT as having a bowl as well as tines (like a fork), but Bard was more likely to describe the spoon as having a long handle.  The spoon went on many adventures and had many friends.  Whilst many poems had the spoon scooping and twirling, three ChatGPT poems and one Bard poem particularly stood out.  One involved a pink gorilla with a runcible hat, while a second and the Bard poem involved a runcible cat and one poem told an entire story finishing with “For it was not the spoon, that held the magic inside, But the heart of the owner, that made dreams come alive”.  

Cosine similarity is a metric often used to compare text by measuring the similarity between two vectors as the cosine of the angle between them, when each word is represented by a vector of the number of occurences of each word in the document.
I compared the poems with the cosine similarity metric of the word frequencies as below, starting with these crates:

```
use std::fs::File;
use rust_stemmers::{Algorithm, Stemmer};
use std::collections::{HashMap, BTreeMap};
use std::io::{BufReader,BufRead};
use text_analysis::count_words;

fn cosine_similarity(val: &[f64], va: &[f64]) -> f64 {
    let dot: f64 = val.iter().zip(va.iter()).map(|(a,b)| a * b).sum();
    let sq1 = val.iter().map(|x| x * x).sum::<f64>();
    let sq2 = va.iter().map(|y| y * y).sum::<f64>();
    let prods = sq1.sqrt() * sq2.sqrt();
    if prods == 0.0 { 0.0 } else { dot/prods }
}  
```

And then created some functions for more general statistics:

```
fn median(vector: Vec<f64>) -> f64 {
    let n = vector.len();
    let half = n/2;
    if n % 2 == 0 {
       (vector[half] + vector[half-1])/2.0
    } else {
       vector[half]
       }
}

fn standard_deviation(vector: &Vec<f64>) -> f64 {
    let mut sum_of_squares = 0.0;
    //calculate the variance
    let mean = vector.iter().sum::<f64>() / vector.len() as f64;
    for value in vector {
        sum_of_squares += (value - mean).powi(2);
        }
    //the standard deviation is the square root of the variance
    (sum_of_squares/vector.len() as f64).sqrt()
}

fn receive_stats(hash1: HashMap<String,Vec<f64>>, vocablen: usize, po_wd_cnt: &mut Vec<f64>) -> (f64,f64,f64,f64,f64,f64,f64,f64,f64) {
      let mut poem_vocab: Vec<f64> = Vec::new();
      let mut poem_repeats: Vec<f64> = Vec::new();
      let mut cosine_sim: HashMap<(String,String),f64> = HashMap::new();
          for (poem,val) in hash1.clone() {
	     //find the number of repeated words
             let sum_of_ones = val.iter().filter(|&x| *x == 1.0).sum::<f64>();
             poem_repeats.push((vocablen as f64 - sum_of_ones)/vocablen as f64);
             poem_vocab.push(val.iter().filter(|value| value > &&0.0).count() as f64);
             for (po,va) in hash1.clone() {
                let result = cosine_similarity(&val, &va);
                //println!("{:?} {:?} {:?}",poem,po,result);
                cosine_sim.insert((poem.to_string(), po.to_string()),result);
                }
          }
       let mut stats = vec![];
       for ((_poem,_po),similarity) in cosine_sim {
          stats.push(similarity);
          }
       let sum: f64 = stats.iter().sum();
       //calculate the mean and the standard deviation of the cosine similarities across all poems
       let mean: f64 = sum/stats.len() as f64;
       let std_dev: f64 = standard_deviation(&stats);
       //println!("std dev {:?}", std_dev);
       //count the number of words repeated and find the mean 
       let repeats_mean: f64 = poem_repeats.iter().sum::<f64>()/poem_repeats.len() as f64;
       //identify the mean vocabulary over the poems
       let poem_vocab_mean: f64 = poem_vocab.iter().sum::<f64>()/poem_vocab.len() as f64;
       stats.sort_by(|a, b| b.partial_cmp(a).unwrap().reverse());
       po_wd_cnt.sort_by(|a,b| b.partial_cmp(a).unwrap().reverse());
       let min = stats.first().unwrap();
       let max = stats.last().unwrap();
       let range = max - min;
       //find the difference between the max and min values as the range
       let wrd_range = po_wd_cnt.last().unwrap() - po_wd_cnt.first().unwrap();
       let wrd_mean: f64 = po_wd_cnt.iter().sum::<f64>() / po_wd_cnt.len() as f64;
       let dist_median: f64 = median(stats);
       let word_cnt_median: f64 = median(po_wd_cnt.to_vec());
       (mean, std_dev, range, dist_median, wrd_range, wrd_mean, word_cnt_median, repeats_mean, poem_vocab_mean)
 }

fn add_entries(matrix_hash: &BTreeMap<(usize, usize), f64>, vocab: &BTreeMap<String,usize>, total: &mut HashMap<String, Vec<f64>>, start: usize, end: usize) {
    //function for unsparsing the matrix ahead of the cosine similarity comparisons
    for x in 0..=vocab.len() {
        for y in start..=end {
            let item = total.entry(y.to_string()).or_insert(Vec::new());
            let value = matrix_hash.get(&(x, y)).cloned().unwrap_or(0.0);
            item.push(value);
        }
    }
}

```
The main function reads in the files and stems all the words, removing punctuation and putting them into lowercase for a better comparison of word frequency counts.
I decided to use the ordered BTreeMap to build a structure like a sparse matrix which holds the word, and the word count per poem.  
When not sparse, the matrix has word strings as rows, the poem number as the column and contains the word count frequency for each poem which could be zero.

```
fn main() {
    let files = ["ChatGPTsbestpoems.txt", "BardBestPoems.txt"];
    let mut vocab: BTreeMap<String,usize> = BTreeMap::new();
    let mut matrix_hash: BTreeMap<(usize,usize),f64> = BTreeMap::new();
    let mut poem_word_cnt: i32 = 0;
    let mut po_wd_cnt = vec![];
    let mut total_po_wd_cnt: HashMap<String, Vec<f64>> = HashMap::new();
    let mut poem_cnt: i32 = 0;
    for f in files.iter() {
       let fname = format!("{:?}", f);
       let f = File::open(f).expect("file did not open");
       let reader = BufReader::new(f);
       let en_stemmer = Stemmer::create(Algorithm::English);
       let en_stop_words = stop_words::get(stop_words::LANGUAGE::English);
       let mut poem_words: Vec<String> = Vec::new();
       for poem_line in reader.lines() {
        //check if the poem is finished
           let poem_line = &poem_line.unwrap();
           if !poem_line.is_empty() {
               let poem_vec: Vec<&str> = poem_line.split_whitespace().collect();
               for po_v in poem_vec {
                   let stem = en_stemmer.stem(po_v);
                   let s = stem.replace(&['!', '.','\'','\"',',','?'][..],"");
                   poem_word_cnt+=1;
                   if !en_stop_words.contains(&s.to_lowercase()) {
                         let index = vocab.len();
                         vocab.entry(s.to_lowercase()).or_insert(index);
                         poem_words.push(s.to_lowercase());
                         }
                      }
           } else {
                  poem_cnt+=1;
                  po_wd_cnt.push(poem_word_cnt as f64);
                  let count_po = count_words(&poem_words);
                  for (k,v) in count_po.iter() {
                     matrix_hash.insert((vocab[k],poem_cnt as usize),*v as f64);
                     }
                  poem_words = Vec::new();
                  poem_word_cnt = 0;
                  }
           }
        total_po_wd_cnt.entry(fname).or_insert(po_wd_cnt.clone());
    }
    let mut totalchat: HashMap<String,Vec<f64>> = HashMap::new();
    let mut totalbard: HashMap<String,Vec<f64>> = HashMap::new();
    add_entries(&matrix_hash, &vocab, &mut totalchat, 0, 35);
    add_entries(&matrix_hash, &vocab, &mut totalbard, 36, 70);
    let totalchatresults = receive_stats(totalchat, vocab.len(), total_po_wd_cnt.get_mut("\"ChatGPTsbestpoems.txt\"").unwrap());
    let totalbardresults = receive_stats(totalbard, vocab.len(), total_po_wd_cnt.get_mut("\"BardBestPoems.txt\"").unwrap());
    println!("Name:  mean, std_dev, range, median_sim, word_range, word_mean, word_count_median, repeats_mean, poem_vocab_mean");
    println!("ChatGPT: {:.3?}", totalchatresults);
    println!("Bard: {:.3?}", totalbardresults);
}
```

And the results:  
  
Name:  mean, std_dev, range, median_sim, word_range, word_mean, word_count_median, repeats_mean, poem_vocab_mean. <br />
ChatGPT: (0.406, 0.164, 1.000, 0.398, 142.000, 164.229, 162.000, 0.958, 48.944). <br />
Bard: (0.539, 0.175, 0.902, 0.548, 245.000, 148.971, 141.000, 0.980, 26.714). <br />
  
The Bard poems were slightly more similar to each other in the cosine similarity metric than the ChatGPT poems, although this was not statistically significant by T-test.  In mean and median poem lengths, ChatGPT tended to write longer poems.  However, Bard wrote both the longest poem and the shortest and had a larger range of poem lengths.  Looking at repeated words, Bard had a slight increased tendency to repeat words across the poems, whilst overall ChatGPT had provided a larger vocabulary.  With a smaller difference in word range, the teacher might pick up on ChatGPT for the more consistent poem structure, whilst Bard had a greater range of different layouts.  
In conclusion, I felt that I had a personal preference for the content of the ChatGPT poems, although their more consistent layout and possibly style as well compared to Bard poems could prove a way for our teacher to notice AI use.
  
Poem text files can be found [here](https://github.com/LCrossman/investigate_chatgpt_bard). 
  
