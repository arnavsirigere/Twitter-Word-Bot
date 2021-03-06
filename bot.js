console.log('Word Bot starting!');

const keepAlive = require('./server');
keepAlive();

require('dotenv').config();
let fetch = require('node-fetch');
let Twit = require('twit');

const apiKey = process.env.WORDNIK_API_KEY;

const config = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};
let T = new Twit(config);

// Tweet at the beginning
tweet();
// And then tweet every hour
setInterval(tweet, 60 * 60 * 1000);

function tweet() {
  getWord()
    .then((content) => {
      let status = `Word of the Hour - ${content.word}\nDefinition -  ${content.definition ? content.definition : 'Definition not available!'}\n\n#wordnik Wordnik Url - ${content.wordnikUrl}\nDefinition Attribution - ${content.attribution.split(',')[0]}`;
      console.log(status);
      T.post('statuses/update', { status: status }, tweeted);
    })
    .catch((err) => console.error(err));
}

function tweeted(err, data, response) {
  if (err) {
    console.error(err);
    tweet();
  } else {
    console.log('Tweeted!');
  }
}

async function getWord() {
  let wordUrl = `https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=7&maxLength=7&api_key=${apiKey}`;
  let wordResponse = await fetch(wordUrl);
  let wordData = await wordResponse.json();
  let word = wordData.word;

  let defUrl = `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=200&includeRelated=false&useCanonical=false&includeTags=false&api_key=${apiKey}`;
  let defResponse = await fetch(defUrl);
  let defData = await defResponse.json();
  let attribution = defData.length ? defData[0].attributionText : defData.attributionText;
  let wordnikUrl = defData.length ? defData[0].wordnikUrl : defData.wordnikUrl;

  let definition;

  if (defData.length > 0) {
    let counter = 0;
    while (!definition && counter < defData.length) {
      definition = defData[counter].text;
      counter++;
    }
  } else {
    defintiion = defData.text;
  }

  // Sometimes, if the word is suppose elephants, the definition is "plural form of elephant", which is not so convenient.
  if (/Plural form of .*/.test(definition)) {
    definition = null;
    let dUrl = `https://api.wordnik.com/v4/word.json/${word.substring(0, word.length - 1)}/definitions?limit=200&includeRelated=false&useCanonical=false&includeTags=false&api_key=${apiKey}`;
    let dResponse = await fetch(dUrl);
    defData = await dResponse.json();
    if (defData.length > 0) {
      counter = 0;
      while (!definition && counter < defData.length) {
        definition = defData[counter].text;
        counter++;
      }
    } else {
      definition = defData.text;
    }
  }

  definition = definition
    .replace(/<\/?\w+>/g, '')
    .replace(/<\/?\s*\w+\s*\w+\s*>/g, '')
    .replace(/<.*>/, '');
  return { word, definition, attribution, wordnikUrl };
}
