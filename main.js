// load modules
const express = require('express');
const handlebars = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;

// configure environment
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;
const API_KEY = process.env.API_KEY || '';
const URL = 'https://newsapi.org/v2/top-headlines';

// create an instance of express
const app = express();

// configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

// configure routes
app.get(['/', '/index.html'], (req, res) => {
    res.status('200');
    res.type('text/html');
    res.render('index');
});

app.get('/search', async (req, res) => {
    const endpoint = withQuery(URL, {
        q: req.query.keyword,
        country: req.query.country,
        category: req.query.category,
        apiKey: API_KEY
    });
    console.info('>> Endpoint: ', endpoint);
    console.log('>> Freshness: ', req.fresh);
    
    let fetchResult;
    let data;

    try {
        fetchResult = await fetch(endpoint);
        data = await fetchResult.json();
    } catch(e) {
        console.error('Error in fecthing request. Message: ', e);
    }

    // console.log('>> Data: ', data);

    const newsArr = data.articles.map(news => ({
        title: news.title,
        img: news.urlToImage,
        summary: news.description,
        datetime: news.publishedAt,
        link: news.url
    }));

    // console.log('>> News Array: ', newsArr);

    res.status(200);
    res.set('Cache-Control', 'public, max-age=600');
    res.type('text/html');
    res.render('result', {
        keyword: req.query.keyword,
        hasContent: !!newsArr.length,
        newsArr: newsArr
    });
});

// static resources
app.use(express.static(__dirname + '/static'));

// start server
if(API_KEY) {
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
        console.info('>> With API_KEY: ', API_KEY);
    });
} else {
    console.error(`Application failed to start. API_KEY not found.`);
}