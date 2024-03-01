const fs = require("fs");
const {parseString} = require('xml2js');
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const start = Date.now();
const sitemapUrl = 'https://www.dns-shop.ru/sitemap.xml';
const mapLinks = [];
const fridges = [];
const microdata = [];

function logTime(time) {
    return time >= 60000
        ? `${Math.floor(time / 60000)} минут ${Math.floor(time % 60000 / 1000)} секунд`
        : `${Math.floor(time % 60000 / 1000)} секунд`;
}

// async function delay(ms) {
//     return new Promise(resolve => {
//         setTimeout(resolve, ms);
//     })
// }

function writeToTXT(arr, arrName) {
    arr.forEach(
        link => fs.appendFileSync(
            `output/${arrName}.txt`,
            link + "\n",
            (err) => {
                if (err) console.error(err);
            }))
}

async function getXMLData(sitemap) {
    const response = await fetch(sitemap);
    return await response.text();
}

async function getJSONData(sitemap) {
    const response = await fetch(sitemap);
    return await response.json();
}

async function parseXML() {
    const xml = await getXMLData(sitemapUrl);

    // Array of sitemap links (all DNS-shop products)
    // [sitemap products1,sitemap products2, ...]
    parseString(xml, (err, result) => {
        result.sitemapindex.sitemap.forEach(map => {
            if (map.loc[0].includes("product")) mapLinks.push(map.loc[0]);
        })
    });

    //for each sitemap product
    for (const mapLink of mapLinks) {
        // get xml files and parse them
        const productsXML = await getXMLData(mapLink);
        parseString(productsXML, (err, result) => {
            for (let link of result.urlset.url) {
                // check all products in DNS with links that includes
                // "vstraivaemyj-holodilnik"
                if (link.loc[0].includes("vstraivaemyj-holodilnik")) fridges.push(link.loc[0]);
            }
        });
    }
}

async function getMicrodata() {
    const browser = await puppeteer.launch({
        headless: true,
       });
    let page = await browser.newPage();
    // await page.setRequestInterception(true);
    await page.setViewport({width: 1080, height: 1024});
    console.log('Открылся браузер');

    console.log(mapLinks);
    console.log(fridges);

    for (let item of fridges) {
        const productId = item.match(/(?<=product.)[0-9a-z]{8}/gm)[0];
        page.on('request', interReq => {
            // if (interReq.isInterceptResolutionHandled()) return;
            if (interReq.url().includes(`microdata/${productId}`)) {
                microdata.push(interReq.url());
                // interReq.continue();
            }
            // if (
            //     interReq.resourceType() === "image" ||
            //     interReq.resourceType() === "stylesheet" ||
            //     interReq.resourceType() === "font"
            // ) interReq.abort();
        });
        await page.goto(item, {waitUntil: "networkidle2"});
        console.log("перешли на страницу", item);
    }
    console.log(microdata);
    console.log("Парсинг закончился. Браузер закрывается");
    await browser.close();
    console.log("Данные спарсились за ", logTime(Date.now() - start));
}

(async function parser() {
    try {
        await parseXML();
        await getMicrodata();

        fs.rmdirSync("output", {recursive: true});
        fs.mkdirSync("output");

        writeToTXT(mapLinks, "mapLinks");
        writeToTXT(microdata, "microdata");
        writeToTXT(fridges, "fridges");

        process.exit();
    } catch (e) {
        if (e) throw e;
    }
})()

