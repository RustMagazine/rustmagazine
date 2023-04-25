**A Data Science View of ChatGPT and Bard**

&nbsp;&nbsp;&nbsp;What if a Teacher asked the entire class to write a nonsense poem as a creative task for homework?  If a whole class of 35 uses ChatGPT or Bard to write a nonsense poem about a runcible spoon – would the teacher be able to tell?  In other words, is the output repetitive if asked to carry out a specific task several times.  Even the number of verses or a pattern in the length of the sentences could alert our teacher and the game could be up!

&nbsp;&nbsp;&nbsp;To test this out, I collected a set of 35 poems requesting both ChatGPT and Bard to “write a nonsense poem about a runcible spoon”, on several different days and times and saving the results to a text file.  So, let’s focus on the runcible spoon, a made-up word or so I thought.  It turned out ChatGPT knew more than me on that point.  "Runcible" far from being a made-up word turns out to be a description of a utensil somewhere between a spoon and a fork from the olden days (like a “spork” used in camping).  

&nbsp;&nbsp;&nbsp;In different poems, the spoon was described as silly, odd, fancy, chic, wriggly and bright, of silver, of tin, of gold, had powers untold, with a handle made of silver, wood, jelly, shaped like a pair of dice, made of a rainbow’s light, made of a metal that nobody knows, glows in the dark like a bright red rose.

&nbsp;&nbsp;&nbsp;The spoon was many times described by ChatGPT as having a bowl as well as tines (like a fork), but Bard was more likely to describe the spoon as having a long handle.  The spoon went on many adventures and had many friends.  Whilst many poems had the spoon scooping and twirling, three ChatGPT poems and one Bard poem particularly stood out.  One involved a pink gorilla with a runcible hat, while a second and the Bard poem involved a runcible cat and one poem told an entire story finishing with “For it was not the spoon, that held the magic inside, But the heart of the owner, that made dreams come alive”.  

I compared the poems with the cosine similarity metric of the word frequencies as below, starting with these crates

```
use std::fs::File;
use rust_stemmers::{Algorithm, Stemmer};
use std::collections::HashMap;
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

And then created some functions for more general statistics

```
fn median(vector: Vec<f64>) -> f64 {
    let n = vector.len();
    let half = n/2;
    if n % 2 == 0 {
       (vector[half] + vector[half+1])/2.0
    } else {
       vector[half]
       }
}

fn receive_stats(hash1: HashMap<String,Vec<f64>>, mut po_wd_cnt: &mut Vec<f64>) -> (f64,f64,f64,f64,f64,f64) {
      //split the matrix_hash into chat and bard poems
      let mut cosine_sim: HashMap<(String,String),f64> = HashMap::new();
          for (poem,val) in hash1.clone() {
             for (po,va) in hash1.clone() {
                let result = cosine_similarity(&val, &va);
                cosine_sim.insert((poem.to_string(), po.to_string()),result);
                }
          }
       let mut stats = vec![];
       for ((_poem,_po),similarity) in cosine_sim {
          stats.push(similarity);
          }
       let sum: f64 = stats.iter().sum();
       let mean: f64 = sum/stats.len() as f64;
       //sort the similarity by partial cmp for f64 to find the min and max
       stats.sort_by(|a, b| b.partial_cmp(a).unwrap().reverse());
       po_wd_cnt.sort_by(|a,b| b.partial_cmp(a).unwrap().reverse());
       let min = stats.first().unwrap();
       let max = stats.last().unwrap();
       let range = max - min;
       let wrd_range = po_wd_cnt.last().unwrap() - po_wd_cnt.first().unwrap();
       let wrd_mean: f64 = po_wd_cnt.iter().sum::<f64>() / po_wd_cnt.len() as f64;
       let dist_median: f64 = median(stats);
       let word_cnt_median: f64 = median(po_wd_cnt.to_vec());
       (mean, range, dist_median, wrd_range, wrd_mean, word_cnt_median)
 }
```
Main function reads in the files and stems all the words, removing punctuation and putting into lowercase for a better comparison

```
fn main() {
    let files = ["ChatGPTsbestpoems.txt", "BardBestPoems.txt"];
    let mut matrix_hash: HashMap<(usize,usize),f64> = HashMap::new();
    let mut total_poem_words: Vec<String> = Vec::new();
    let mut poem_word_cnt: i32 = 0;
    let mut po_wd_cnt = vec![];
    let mut total_po_wd_cnt: HashMap<String, Vec<f64>> = HashMap::new();
    for f in files.iter() {
       let fname = format!("{:?}", f);
       let f = File::open(f).expect("file did not open");
       let reader = BufReader::new(f);
       let en_stemmer = Stemmer::create(Algorithm::English);
       let en_stop_words = stop_words::get(stop_words::LANGUAGE::English);
       let mut poem_cnt: i32 = 0;
       let mut poem_words: Vec<String> = Vec::new();
       for poem_line in reader.lines() {
        //check if the poem is finished, each poem is separated by an empty line
           let poem_line = &poem_line.unwrap();
           if !poem_line.is_empty() {
               let poem_vec: Vec<&str> = poem_line.split_whitespace().collect();
               for po_v in poem_vec {
                   //collecting the poem words and cleaning
                   total_poem_words.push(po_v.to_lowercase());
                   let stem = en_stemmer.stem(po_v);
                   let s = stem.replace(&['!', '.','\'','\"',',','?'][..],"");
                   poem_word_cnt+=1;
                   if !en_stop_words.contains(&s.to_lowercase()) {
                      poem_words.push(s.to_lowercase());
                      }
                   }
           } else {
                  //the poem is finished, collect details
                  poem_cnt+=1;
                  po_wd_cnt.push(poem_word_cnt as f64);
                  //use text_analysis crate
                  let count_po = count_words(&poem_words);
                  //save the frequencies as a matrix hash which is sparse
                  for (c, (k_,v)) in count_po.iter().enumerate() {
                     matrix_hash.insert((c,poem_cnt as usize),*v as f64);
                     }
                  poem_words = Vec::new();
                  //re-initialize the poem_word_cnt
                  poem_word_cnt = 0;
                  }
           }
        //save the details on the poem word counts
        total_po_wd_cnt.entry(fname).or_insert(po_wd_cnt.clone());
    }
//final part of the main function to collect the results and print them
    let mut totalchat: HashMap<String,Vec<f64>> = HashMap::new();
    let mut totalbard: HashMap<String,Vec<f64>> = HashMap::new();
    for ((ke,ye),value) in matrix_hash.iter() {
         if ye <= &35 {
             //these are poems from ChatGPT, save all the cosine similarities under the poem name
             let item = totalchat.entry(ke.to_string()).or_insert(Vec::new());
             item.push(*value);
             }
         else {
             //these are poems from Bard, save all the cosine similarities under the poem name
             let item = totalbard.entry(ke.to_string()).or_insert(Vec::new());
             item.push(*value);
             }
    }
    let totalchatresults = receive_stats(totalchat, total_po_wd_cnt.get_mut("\"ChatGPTsbestpoems.txt\"").unwrap());
    let totalbardresults = receive_stats(totalbard, total_po_wd_cnt.get_mut("\"BardBestPoems.txt\"").unwrap());
    println!("ChatGPT: {:?}", totalchatresults);
    println!("Bard: {:?}", totalbardresults);
}
```

And the results:  The Bard poems were more similar to each other in the cosine similarity metric than the ChatGPT poems, however, Bard wrote both the longest poem and the shortest.  In mean and median poem lengths, ChatGPT tended to write longer poems.  With a smaller difference in word range, the teacher might pick up on ChatGPT from that point of view, whilst Bard had a greater range of different layouts but more similar word frequencies.
In conclusion, I felt that I had a personal preference for the content of the ChatGPT poems, although their more consistent layout and possibly style as well compared to Bard poems could prove a way for our teacher to identify AI use.
